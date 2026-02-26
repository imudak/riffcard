/**
 * UX-PITCH-OVERLAY-001: リアルタイムピッチ vs お手本ピッチ重ねグラフ
 * - お手本ピッチ輪郭（薄い青）+ 録音中リアルタイムピッチ（rose）を同一グラフに重ねて表示
 * - 横軸=時間, 縦軸=音の高さ（ノート名ラベル付き）
 * - 下部に録音経過時間の進行バー（お手本を聴かなくても常時表示）
 * - 歌い始めタイミングの緑マーカー
 */
import { useState, useEffect, useRef } from 'react';
import { PitchDetector } from 'pitchy';
import { analyzeAudio, freq2midi, midiToNoteName } from '@lib/audio';

interface RealtimePitchOverlayProps {
  referenceBlob: Blob | null;
  stream: MediaStream | null;
  /** 歌い始め位置（秒）。緑マーカーで表示 */
  onsetTime?: number;
  height?: number;
}

interface PitchSample {
  t: number;    // 秒
  midi: number;
}

const SVG_W = 300;
const PAD_L = 28; // Y軸ラベル用左パディング
const PAD_R = 4;
const PAD_T = 4;
const PAD_B = 4;

export function RealtimePitchOverlay({
  referenceBlob,
  stream,
  onsetTime,
  height = 120,
}: RealtimePitchOverlayProps) {
  const [refPoints, setRefPoints] = useState<PitchSample[]>([]);
  const [refDuration, setRefDuration] = useState(0);
  const [currentPoints, setCurrentPoints] = useState<PitchSample[]>([]);
  const [elapsed, setElapsed] = useState(0);

  const rafRef = useRef<number | null>(null);
  const currentPtsRef = useRef<PitchSample[]>([]);

  /** お手本ピッチ輪郭を抽出 */
  useEffect(() => {
    if (!referenceBlob) {
      setRefPoints([]);
      setRefDuration(0);
      return;
    }
    let cancelled = false;
    (async () => {
      try {
        const result = await analyzeAudio(referenceBlob);
        if (cancelled) return;
        const dur = result.duration > 0 ? result.duration : 1;
        setRefDuration(dur);
        const voiced = result.pitchFrames.filter((f) => f.midi > 0);
        setRefPoints(voiced.map((f) => ({ t: f.time, midi: f.midi })));
      } catch {
        // ピッチ抽出失敗時はお手本ピッチなしで表示
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [referenceBlob]);

  /** リアルタイムピッチ検出 */
  useEffect(() => {
    if (!stream) {
      if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
      currentPtsRef.current = [];
      setCurrentPoints([]);
      setElapsed(0);
      return;
    }

    currentPtsRef.current = [];
    setCurrentPoints([]);
    setElapsed(0);

    const audioCtx = new AudioContext();
    const startTime = audioCtx.currentTime;

    const analyser = audioCtx.createAnalyser();
    analyser.fftSize = 2048;
    const source = audioCtx.createMediaStreamSource(stream);
    source.connect(analyser);

    const buffer = new Float32Array(analyser.fftSize);
    const detector = PitchDetector.forFloat32Array(analyser.fftSize);

    let frameCount = 0;
    const detect = () => {
      const t = audioCtx.currentTime - startTime;
      frameCount++;

      analyser.getFloatTimeDomainData(buffer);
      const [frequency, clarity] = detector.findPitch(buffer, audioCtx.sampleRate);

      if (clarity > 0.8 && frequency > 80 && frequency < 1000) {
        const midi = freq2midi(frequency);
        if (midi > 0) {
          currentPtsRef.current.push({ t, midi });
        }
      }

      // 約10fpsでstate更新（60fps÷6）
      if (frameCount % 6 === 0) {
        setCurrentPoints([...currentPtsRef.current]);
        setElapsed(t);
      }

      rafRef.current = requestAnimationFrame(detect);
    };
    rafRef.current = requestAnimationFrame(detect);

    return () => {
      if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
      source.disconnect();
      audioCtx.close();
    };
  }, [stream]);

  // SVGレイアウト計算
  const chartW = SVG_W - PAD_L - PAD_R;
  const chartH = height - PAD_T - PAD_B - 8; // -8 for progress bar

  const allMidis = [...refPoints.map((p) => p.midi), ...currentPoints.map((p) => p.midi)];
  const minMidi = allMidis.length > 0 ? Math.min(...allMidis) - 3 : 55;
  const maxMidi = allMidis.length > 0 ? Math.max(...allMidis) + 3 : 75;
  const midiRange = maxMidi - minMidi || 12;

  const totalDuration = Math.max(refDuration || 1, elapsed + 0.1);
  const toX = (t: number) => PAD_L + (t / totalDuration) * chartW;
  const toY = (midi: number) => PAD_T + chartH - ((midi - minMidi) / midiRange) * chartH;

  // お手本ピッチパス
  const refPath =
    refPoints.length > 0
      ? refPoints
          .map((p, i) => `${i === 0 ? 'M' : 'L'}${toX(p.t).toFixed(1)},${toY(p.midi).toFixed(1)}`)
          .join(' ')
      : '';

  // 録音中ピッチパス
  const currPath =
    currentPoints.length > 0
      ? currentPoints
          .map((p, i) => `${i === 0 ? 'M' : 'L'}${toX(p.t).toFixed(1)},${toY(p.midi).toFixed(1)}`)
          .join(' ')
      : '';

  // Y軸Cノート（オクターブ境界）グリッドライン
  const cNoteGrids: { midi: number; label: string }[] = [];
  for (let m = Math.floor(minMidi); m <= Math.ceil(maxMidi); m++) {
    if (m % 12 === 0) {
      cNoteGrids.push({ midi: m, label: midiToNoteName(m) });
    }
  }

  // 進行バー（録音経過時間 / お手本長さ）
  const progressPct = refDuration > 0 ? Math.min((elapsed / refDuration) * 100, 100) : 0;
  // 歌い始めマーカー位置（進行バー上）
  const onsetPct =
    onsetTime !== undefined && onsetTime > 0 && refDuration > 0
      ? Math.min((onsetTime / refDuration) * 100, 100)
      : null;

  return (
    <div className="w-full" data-testid="realtime-pitch-overlay">
      <svg
        viewBox={`0 0 ${SVG_W} ${height}`}
        className="w-full rounded-t-lg bg-gray-50"
        aria-label="リアルタイムピッチグラフ"
        role="img"
      >
        {/* Y軸グリッド線 + ノート名ラベル */}
        {cNoteGrids.map(({ midi, label }) => {
          const y = toY(midi);
          return (
            <g key={midi}>
              <line
                x1={PAD_L}
                y1={y}
                x2={SVG_W - PAD_R}
                y2={y}
                stroke="#e5e7eb"
                strokeWidth="0.5"
              />
              <text x={PAD_L - 2} y={y + 3} fontSize="8" textAnchor="end" fill="#9ca3af">
                {label}
              </text>
            </g>
          );
        })}

        {/* 歌い始めタイミングの緑マーカー（SVG内） */}
        {onsetTime !== undefined && onsetTime > 0 && (
          <line
            x1={toX(onsetTime)}
            y1={PAD_T}
            x2={toX(onsetTime)}
            y2={PAD_T + chartH}
            stroke="#22c55e"
            strokeWidth="1"
            opacity="0.8"
          />
        )}

        {/* お手本ピッチ輪郭（薄い青） */}
        {refPath && (
          <path
            d={refPath}
            fill="none"
            stroke="#93c5fd"
            strokeWidth="1.5"
            strokeLinejoin="round"
            strokeLinecap="round"
            opacity="0.7"
          />
        )}

        {/* 録音中リアルタイムピッチ（rose） */}
        {currPath && (
          <path
            d={currPath}
            fill="none"
            stroke="#f43f5e"
            strokeWidth="2"
            strokeLinejoin="round"
            strokeLinecap="round"
          />
        )}

        {/* 現在の録音位置カーソル */}
        {elapsed > 0 && (
          <line
            x1={toX(elapsed)}
            y1={PAD_T}
            x2={toX(elapsed)}
            y2={PAD_T + chartH}
            stroke="#f43f5e"
            strokeWidth="1"
            strokeDasharray="2,2"
            opacity="0.4"
          />
        )}
      </svg>

      {/* 進行バー（録音経過 / お手本長さ、常時表示） */}
      <div
        role="progressbar"
        aria-valuenow={Math.round(progressPct)}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label="録音進行"
        className="relative h-1.5 w-full overflow-hidden rounded-b-lg bg-gray-200"
      >
        <div
          className="h-full rounded-full bg-rose-500 transition-[width] duration-100"
          style={{ width: `${progressPct}%` }}
        />
        {onsetPct !== null && (
          <div
            title="歌い始め"
            className="absolute top-0 h-full w-0.5 bg-green-500"
            style={{ left: `${onsetPct}%` }}
          />
        )}
      </div>
    </div>
  );
}
