import type { Take } from '@lib/db';
import { AudioPlayer } from './AudioPlayer';

interface TakeItemProps {
  take: Take;
  index: number;
}

export function TakeItem({ take, index }: TakeItemProps) {
  return (
    <div className="flex items-center justify-between rounded-lg border border-gray-200 bg-white px-4 py-3">
      <div className="flex items-center gap-3">
        <span className="text-sm text-gray-400">#{index}</span>
        <span className="font-medium text-gray-900">{Math.round(take.totalScore)}点</span>
        <span className="text-xs text-gray-500">
          {take.recordedAt.toLocaleDateString('ja-JP', {
            month: 'numeric',
            day: 'numeric',
          })}{' '}
          {take.recordedAt.toLocaleTimeString('ja-JP', {
            hour: '2-digit',
            minute: '2-digit',
          })}
        </span>
      </div>
      <AudioPlayer blob={take.audioBlob} label="聴く" />
    </div>
  );
}
