/**
 * S5: スコア結果画面
 * REQ-RC-PITCH-005: スコア表示, REQ-RC-UX-004: もう一度ボタン
 * REQ-RC-PLAY-002: テイク再生
 * REQ-RC-PITCH-007: ピッチ差分グラフ表示
 * REQ-RC-DATA-006: Takeのundo削除
 */
import { useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { openDB, TakeRepository } from '@lib/db';
import { useTakes } from '../hooks/useTakes';
import { usePhrase } from '../hooks/usePhrase';
import { ScoreDisplay } from '../components/ScoreDisplay';
import { AudioPlayer } from '../components/AudioPlayer';
import { BackButton } from '../components/BackButton';
import { ConfirmDialog } from '../components/ConfirmDialog';
import { PitchDeviationChart } from '../components/PitchDeviationChart';

export function ScoreResultPage() {
  const { id, takeId } = useParams<{ id: string; takeId: string }>();
  const navigate = useNavigate();
  const { takes, loading } = useTakes(id!);
  const { phrase } = usePhrase(id!);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const take = takes.find((t) => t.id === takeId);

  /** REQ-RC-DATA-006: このテイクを削除して練習録音画面へ */
  const handleDeleteTake = useCallback(async () => {
    if (!take) return;
    try {
      const db = await openDB();
      const repo = new TakeRepository(db);
      await repo.delete(take.id);
      navigate(`/phrases/${id}/practice`);
    } catch {
      // 削除失敗時はダイアログを閉じるだけ
    } finally {
      setShowDeleteConfirm(false);
    }
  }, [take, id, navigate]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p className="text-gray-500">読み込み中...</p>
      </div>
    );
  }

  if (!take) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p className="text-gray-500">結果が見つかりません</p>
      </div>
    );
  }

  return (
    <div className="mx-auto min-h-screen max-w-lg bg-gray-50">
      <header className="sticky top-0 z-10 flex items-center gap-3 bg-white px-4 py-3 shadow-sm">
        <BackButton label="結果" />
      </header>

      <main className="flex flex-col items-center gap-6 p-6">
        <ScoreDisplay
          totalScore={take.totalScore}
          pitchScore={take.pitchScore}
          rhythmScore={take.rhythmScore}
        />

        {/* REQ-RC-PITCH-007: ピッチ差分グラフ */}
        {phrase?.referenceAudioBlob && (
          <div className="w-full rounded-lg bg-white p-4 shadow-sm">
            <PitchDeviationChart
              referenceBlob={phrase.referenceAudioBlob}
              practiceBlob={take.audioBlob}
            />
          </div>
        )}

        <hr className="w-full border-gray-200" />

        <div className="flex w-full flex-col gap-3">
          <button
            onClick={() => navigate(`/phrases/${id}/practice`)}
            className="w-full rounded-lg bg-rose-500 py-4 text-lg font-semibold text-white hover:bg-rose-600"
          >
            もう一度
          </button>
          <AudioPlayer blob={take.audioBlob} label="録音を聴く" />
          {/* REQ-RC-DATA-006: Undo削除ボタン */}
          <button
            onClick={() => setShowDeleteConfirm(true)}
            className="w-full rounded-lg border border-red-200 py-3 text-red-500 hover:bg-red-50"
          >
            このテイクを削除
          </button>
          <button
            onClick={() => navigate(`/phrases/${id}`)}
            className="w-full rounded-lg border border-gray-300 py-3 text-gray-600 hover:bg-gray-100"
          >
            フレーズに戻る
          </button>
        </div>
      </main>

      <ConfirmDialog
        open={showDeleteConfirm}
        message="このテイクを削除しますか？削除後は元に戻せません。"
        confirmLabel="削除する"
        onConfirm={handleDeleteTake}
        onCancel={() => setShowDeleteConfirm(false)}
      />
    </div>
  );
}
