/**
 * UX-WAVE-001: ピッチ輪郭表示コンポーネント
 * 音声ファイルのピッチ（音の高低）を時系列 SVG グラフで表示する。
 * お手本・録音の両方で同一コンポーネント・同一スタイルを使用。
 */
import { useState, useEffect } from 'react';
import { analyzeAudio } from '@lib/audio';

interface PitchContourDisplayProps {
  audioBlob: Blob | null;
  height?: number;
  /** 折れ線の色 (デフォルト: rose-500) */
  color?: string;
  /** グラフ上部に表示するラベル */
  label?: string;
}

type DisplayState = 'idle' | 'loading' | 'ready' | 'empty' | 'error';

interface PitchPoint {
  /** 0-1 正規化済み時刻 */
  t: number;
  midi: number;
}

const SVG_WIDTH = 300;
const PAD = 4;

export function PitchContourDisplay({
  audioBlob,
  height = 60,
  color = '#f43f5e',
  label,
}: PitchContourDisplayProps) {
  const [displayState, setDisplayState] = useState<DisplayState>('idle');
  const [points, setPoints] = useState<PitchPoint[]>([]);

  useEffect(() => {
    if (!audioBlob) {
      setDisplayState('idle');
      setPoints([]);
      return;
    }

    let cancelled = false;
    setDisplayState('loading');
    setPoints([]);

    (async () => {
      try {
        const result = await analyzeAudio(audioBlob);
        if (cancelled) return;

        const voiced = result.pitchFrames.filter((f) => f.midi > 0);
        if (voiced.length === 0) {
          setDisplayState('empty');
          return;
        }

        const dur = result.duration > 0 ? result.duration : 1;
        setPoints(voiced.map((f) => ({ t: f.time / dur, midi: f.midi })));
        setDisplayState('ready');
      } catch {
        if (!cancelled) setDisplayState('error');
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [audioBlob]);

  if (!audioBlob || displayState === 'idle') return null;

  if (displayState === 'loading') {
    return (
      <div
        role="status"
        aria-label="ピッチ読み込み中"
        style={{ height }}
        className="w-full animate-pulse rounded-lg bg-gray-200"
      />
    );
  }

  if (displayState === 'empty' || displayState === 'error') {
    return (
      <div
        style={{ height }}
        className="flex w-full items-center justify-center rounded-lg bg-gray-50"
      >
        <span className="text-xs text-gray-400">ピッチデータなし</span>
      </div>
    );
  }

  const midiValues = points.map((p) => p.midi);
  const minMidi = Math.min(...midiValues);
  const maxMidi = Math.max(...midiValues);
  const midiRange = maxMidi - minMidi || 1;

  const chartW = SVG_WIDTH - PAD * 2;
  const chartH = height - PAD * 2;

  const toX = (t: number) => PAD + t * chartW;
  const toY = (midi: number) =>
    PAD + chartH - ((midi - minMidi) / midiRange) * chartH;

  const pathD = points
    .map((p, i) => `${i === 0 ? 'M' : 'L'}${toX(p.t).toFixed(1)},${toY(p.midi).toFixed(1)}`)
    .join(' ');

  return (
    <div className="w-full">
      {label && <div className="mb-1 text-xs text-gray-500">{label}</div>}
      <svg
        viewBox={`0 0 ${SVG_WIDTH} ${height}`}
        className="w-full rounded-lg bg-gray-50"
        aria-label="ピッチ輪郭グラフ"
        role="img"
      >
        <path
          d={pathD}
          fill="none"
          stroke={color}
          strokeWidth="2"
          strokeLinejoin="round"
          strokeLinecap="round"
        />
      </svg>
    </div>
  );
}
