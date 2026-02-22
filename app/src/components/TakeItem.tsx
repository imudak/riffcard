/**
 * REQ-RC-PLAY-002: テイク再生
 * REQ-RC-DATA-007: フレーズ詳細からのTake削除
 */
import { useState } from 'react';
import type { Take } from '@lib/db';
import { AudioPlayer } from './AudioPlayer';
import { ConfirmDialog } from './ConfirmDialog';

interface TakeItemProps {
  take: Take;
  index: number;
  /** REQ-RC-DATA-007: 削除コールバック */
  onDelete?: (id: string) => void;
}

export function TakeItem({ take, index, onDelete }: TakeItemProps) {
  const [showConfirm, setShowConfirm] = useState(false);

  return (
    <>
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
        <div className="flex items-center gap-2">
          <AudioPlayer blob={take.audioBlob} label="聴く" />
          {onDelete && (
            <button
              onClick={() => setShowConfirm(true)}
              className="rounded-lg border border-red-200 px-2 py-1 text-xs text-red-400 hover:bg-red-50"
              aria-label="このテイクを削除"
            >
              削除
            </button>
          )}
        </div>
      </div>

      <ConfirmDialog
        open={showConfirm}
        message="このテイクを削除しますか？"
        confirmLabel="削除"
        onConfirm={() => {
          setShowConfirm(false);
          onDelete?.(take.id);
        }}
        onCancel={() => setShowConfirm(false)}
      />
    </>
  );
}
