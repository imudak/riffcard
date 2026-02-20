interface ScoreDisplayProps {
  totalScore: number;
  pitchScore: number;
  rhythmScore: number;
}

function getLabel(score: number): string {
  if (score >= 90) return '優秀！';
  if (score >= 70) return '良好';
  if (score >= 50) return '練習中';
  return 'がんばろう';
}

function getLabelColor(score: number): string {
  if (score >= 90) return 'text-yellow-500';
  if (score >= 70) return 'text-green-500';
  if (score >= 50) return 'text-blue-500';
  return 'text-gray-500';
}

export function ScoreDisplay({ totalScore, pitchScore, rhythmScore }: ScoreDisplayProps) {
  const rounded = Math.round(totalScore);
  const label = getLabel(rounded);
  const labelColor = getLabelColor(rounded);

  return (
    <div className="flex flex-col items-center gap-4">
      <div className="text-center">
        <p className="text-7xl font-bold text-gray-900">{rounded}</p>
        <p className="text-2xl text-gray-500">点</p>
        <p className={`mt-2 text-xl font-medium ${labelColor}`}>{label}</p>
      </div>
      <div className="mt-4 w-full max-w-xs space-y-2">
        <div className="flex justify-between rounded-lg bg-white px-4 py-3 shadow-sm">
          <span className="text-gray-600">ピッチ精度</span>
          <span className="font-medium text-gray-900">{Math.round(pitchScore)}点</span>
        </div>
        <div className="flex justify-between rounded-lg bg-white px-4 py-3 shadow-sm">
          <span className="text-gray-600">リズム精度</span>
          <span className="font-medium text-gray-900">{Math.round(rhythmScore)}点</span>
        </div>
      </div>
    </div>
  );
}
