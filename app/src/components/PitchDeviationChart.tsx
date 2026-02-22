/**
 * REQ-RC-PITCH-007: ピッチ差分グラフ表示
 * Task 3: お手本と録音のピッチ差分を折れ線グラフで可視化（SVG実装）
 */
import { useState, useEffect } from 'react';
import { analyzeAudio, alignByDTW } from '@lib/audio';

interface PitchDeviationChartProps {
  referenceBlob: Blob;
  practiceBlob: Blob;
}

interface DeviationPoint {
  index: number;
  cents: number;
}

type ChartState = 'loading' | 'ready' | 'empty' | 'error';

const WIDTH = 320;
const HEIGHT = 120;
const PAD = { top: 8, right: 8, bottom: 20, left: 32 };
const CHART_W = WIDTH - PAD.left - PAD.right;
const CHART_H = HEIGHT - PAD.top - PAD.bottom;
const MAX_CENTS = 100;

function toX(index: number, total: number): number {
  return PAD.left + (total > 1 ? (index / (total - 1)) * CHART_W : CHART_W / 2);
}

function toY(cents: number): number {
  return PAD.top + CHART_H / 2 - (cents / MAX_CENTS) * (CHART_H / 2);
}

export function PitchDeviationChart({ referenceBlob, practiceBlob }: PitchDeviationChartProps) {
  const [chartState, setChartState] = useState<ChartState>('loading');
  const [points, setPoints] = useState<DeviationPoint[]>([]);

  useEffect(() => {
    let cancelled = false;
    setChartState('loading');
    setPoints([]);

    (async () => {
      try {
        const [refResult, pracResult] = await Promise.all([
          analyzeAudio(referenceBlob),
          analyzeAudio(practiceBlob),
        ]);

        if (cancelled) return;

        const refFreqs = refResult.pitchFrames
          .filter((f) => f.frequency > 0)
          .map((f) => f.frequency);
        const pracFreqs = pracResult.pitchFrames
          .filter((f) => f.frequency > 0)
          .map((f) => f.frequency);

        if (refFreqs.length === 0 || pracFreqs.length === 0) {
          setChartState('empty');
          return;
        }

        const aligned = alignByDTW(refFreqs, pracFreqs);
        const deviations: DeviationPoint[] = aligned
          .map(([ref, prac], i) => {
            if (ref <= 0 || prac <= 0) return null;
            const cents = 1200 * Math.log2(prac / ref);
            return { index: i, cents: Math.max(-MAX_CENTS, Math.min(MAX_CENTS, cents)) };
          })
          .filter((p): p is DeviationPoint => p !== null);

        if (deviations.length === 0) {
          setChartState('empty');
          return;
        }

        setPoints(deviations);
        setChartState('ready');
      } catch {
        if (!cancelled) setChartState('error');
      }
    })();

    return () => { cancelled = true; };
  }, [referenceBlob, practiceBlob]);

  if (chartState === 'loading') {
    return <div className="h-28 w-full animate-pulse rounded-lg bg-gray-200" />;
  }

  if (chartState === 'empty' || chartState === 'error') {
    return null;
  }

  const total = points.length;
  const pathD = points
    .map((p, i) => `${i === 0 ? 'M' : 'L'}${toX(p.index, total)},${toY(p.cents)}`)
    .join(' ');

  return (
    <div className="w-full">
      <h4 className="mb-1 text-xs text-gray-500">ピッチ差分 (セント)</h4>
      <svg
        viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
        className="w-full"
        aria-label="ピッチ差分グラフ"
      >
        {/* 縦軸ライン */}
        <line
          x1={PAD.left} y1={PAD.top}
          x2={PAD.left} y2={HEIGHT - PAD.bottom}
          stroke="#e5e7eb"
        />
        {/* 横軸ライン */}
        <line
          x1={PAD.left} y1={HEIGHT - PAD.bottom}
          x2={WIDTH - PAD.right} y2={HEIGHT - PAD.bottom}
          stroke="#e5e7eb"
        />
        {/* 0セントライン */}
        <line
          x1={PAD.left} y1={toY(0)}
          x2={WIDTH - PAD.right} y2={toY(0)}
          stroke="#9ca3af" strokeDasharray="4,4"
        />
        {/* ±50セントライン（緑: 許容範囲） */}
        <line
          x1={PAD.left} y1={toY(50)}
          x2={WIDTH - PAD.right} y2={toY(50)}
          stroke="#86efac" strokeDasharray="2,4"
        />
        <line
          x1={PAD.left} y1={toY(-50)}
          x2={WIDTH - PAD.right} y2={toY(-50)}
          stroke="#86efac" strokeDasharray="2,4"
        />
        {/* Y軸ラベル */}
        <text x={PAD.left - 4} y={toY(0) + 4} textAnchor="end" fontSize="8" fill="#9ca3af">0</text>
        <text x={PAD.left - 4} y={toY(50) + 4} textAnchor="end" fontSize="8" fill="#9ca3af">+50</text>
        <text x={PAD.left - 4} y={toY(-50) + 4} textAnchor="end" fontSize="8" fill="#9ca3af">-50</text>
        {/* 差分折れ線 */}
        <path d={pathD} fill="none" stroke="#f43f5e" strokeWidth="1.5" strokeLinejoin="round" />
      </svg>
    </div>
  );
}
