/**
 * REQ-RC-PLAY-005: お手本ループ再生
 * REQ-RC-PLAY-006: お手本再生速度調整
 */

interface LoopSpeedControlsProps {
  loop: boolean;
  onLoopChange: (loop: boolean) => void;
  playbackRate: number;
  onPlaybackRateChange: (rate: number) => void;
}

const SPEED_OPTIONS: { label: string; value: number }[] = [
  { label: '0.5x', value: 0.5 },
  { label: '0.75x', value: 0.75 },
  { label: '1.0x', value: 1.0 },
];

export function LoopSpeedControls({
  loop,
  onLoopChange,
  playbackRate,
  onPlaybackRateChange,
}: LoopSpeedControlsProps) {
  return (
    <div className="flex items-center gap-3">
      <button
        type="button"
        aria-label="ループ再生"
        aria-pressed={loop}
        onClick={() => onLoopChange(!loop)}
        className={`rounded-lg px-3 py-1.5 text-sm font-medium transition-colors ${
          loop
            ? 'bg-rose-500 text-white hover:bg-rose-600'
            : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
        }`}
      >
        🔁 ループ
      </button>
      <select
        value={playbackRate}
        onChange={(e) => onPlaybackRateChange(parseFloat(e.target.value))}
        className="rounded-lg border border-gray-300 px-2 py-1.5 text-sm text-gray-700"
      >
        {SPEED_OPTIONS.map(({ label, value }) => (
          <option key={value} value={value}>
            {label}
          </option>
        ))}
      </select>
    </div>
  );
}
