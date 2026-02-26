/**
 * S3: フレーズ詳細画面
 * REQ-RC-PLAY-001: お手本再生, REQ-RC-PLAY-002: テイク再生, REQ-RC-PLAY-003: 再生エラー
 * REQ-RC-UX-003: ワンタップ練習, REQ-RC-REC-006: お手本再録音
 * DJ-002: 初回お手本自動再生, DJ-003: タイトル編集
 * REQ-RC-DATA-007: フレーズ詳細からのTake削除
 * REQ-RC-PLAY-005: お手本ループ再生, REQ-RC-PLAY-006: お手本再生速度調整
 * REQ-RC-UX-007: お手本音声波形表示
 * UX-WAVE-001: 波形をピッチ輪郭に統一
 */
import { useState, useCallback } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { openDB, PhraseRepository, TakeRepository } from '@lib/db';
import { usePhrase } from '../hooks/usePhrase';
import { useTakes } from '../hooks/useTakes';
import { AudioPlayer } from '../components/AudioPlayer';
import { LoopSpeedControls } from '../components/LoopSpeedControls';
import { PitchContourDisplay } from '../components/PitchContourDisplay';
import { TakeItem } from '../components/TakeItem';
import { BackButton } from '../components/BackButton';
import { Toast } from '../components/Toast';
import { ConfirmDialog } from '../components/ConfirmDialog';

export function PhraseDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const { phrase, loading, refresh: refreshPhrase } = usePhrase(id!);
  const { takes, refresh: refreshTakes } = useTakes(id!);
  const [editing, setEditing] = useState(false);
  const [editTitle, setEditTitle] = useState('');
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [showRerecordConfirm, setShowRerecordConfirm] = useState(false);
  /** REQ-RC-PLAY-005: ループ再生 */
  const [loop, setLoop] = useState(false);
  /** REQ-RC-PLAY-006: 再生速度 */
  const [playbackRate, setPlaybackRate] = useState(1.0);

  const fromRecording = (location.state as { fromRecording?: boolean } | null)?.fromRecording;

  const handleSaveTitle = useCallback(async () => {
    if (!id || !editTitle.trim()) return;
    try {
      const db = await openDB();
      const repo = new PhraseRepository(db);
      await repo.updateTitle(id, editTitle.trim());
      setEditing(false);
      await refreshPhrase();
    } catch {
      setToastMessage('保存に失敗しました');
    }
  }, [id, editTitle, refreshPhrase]);

  /** REQ-RC-DATA-007: Take削除 */
  const handleDeleteTake = useCallback(async (takeId: string) => {
    try {
      const db = await openDB();
      const repo = new TakeRepository(db);
      await repo.delete(takeId);
      await refreshTakes();
    } catch {
      setToastMessage('削除に失敗しました');
    }
  }, [refreshTakes]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p className="text-gray-500">読み込み中...</p>
      </div>
    );
  }

  if (!phrase) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p className="text-gray-500">フレーズが見つかりません</p>
      </div>
    );
  }

  return (
    <div className="mx-auto min-h-screen max-w-lg bg-gray-50">
      <header className="sticky top-0 z-10 flex items-center justify-between bg-white px-4 py-3 shadow-sm">
        <BackButton to="/" />
        {!editing && (
          <button
            onClick={() => {
              setEditTitle(phrase.title);
              setEditing(true);
            }}
            className="text-gray-500 hover:text-gray-700"
            aria-label="タイトルを編集"
          >
            &#9998;
          </button>
        )}
      </header>

      <main className="p-4">
        {/* タイトル */}
        {editing ? (
          <div className="mb-6 flex gap-2">
            <input
              value={editTitle}
              onChange={(e) => setEditTitle(e.target.value)}
              className="flex-1 rounded-lg border border-gray-300 px-3 py-2 text-lg"
              autoFocus
              maxLength={100}
            />
            <button
              onClick={handleSaveTitle}
              className="rounded-lg bg-rose-500 px-3 py-2 text-white hover:bg-rose-600"
            >
              保存
            </button>
            <button
              onClick={() => setEditing(false)}
              className="rounded-lg px-3 py-2 text-gray-600 hover:bg-gray-100"
            >
              取消
            </button>
          </div>
        ) : (
          <h2 className="mb-6 text-xl font-bold text-gray-900">{phrase.title}</h2>
        )}

        {/* お手本セクション */}
        <section className="mb-6">
          <h3 className="mb-2 text-sm font-medium text-gray-500">お手本</h3>
          {/* UX-WAVE-001: ピッチ輪郭表示（振幅→ピッチに統一） */}
          {phrase.referenceAudioBlob && (
            <PitchContourDisplay audioBlob={phrase.referenceAudioBlob} height={60} />
          )}
          <div className="mt-2 flex items-center gap-3">
            <AudioPlayer
              blob={phrase.referenceAudioBlob}
              label="再生"
              autoPlay={!!fromRecording}
              loop={loop}
              playbackRate={playbackRate}
            />
            <button
              onClick={() => phrase.referenceAudioBlob ? setShowRerecordConfirm(true) : navigate(`/phrases/${id}/reference`)}
              className="rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-600 hover:bg-gray-100"
            >
              再録音
            </button>
          </div>
          {/* REQ-RC-PLAY-005, REQ-RC-PLAY-006: ループ・速度コントロール */}
          {phrase.referenceAudioBlob && (
            <div className="mt-2">
              <LoopSpeedControls
                loop={loop}
                onLoopChange={setLoop}
                playbackRate={playbackRate}
                onPlaybackRateChange={setPlaybackRate}
              />
            </div>
          )}
          {!phrase.referenceAudioBlob && (
            <p className="mt-2 text-sm text-gray-400">お手本が未録音です</p>
          )}
        </section>

        <hr className="mb-6 border-gray-200" />

        {/* 練習ボタン */}
        <button
          onClick={() => navigate(`/phrases/${id}/practice`)}
          className="mb-6 w-full rounded-lg bg-rose-500 py-4 text-lg font-semibold text-white hover:bg-rose-600"
        >
          練習する
        </button>

        <hr className="mb-6 border-gray-200" />

        {/* テイク一覧 */}
        <section>
          <h3 className="mb-3 text-sm font-medium text-gray-500">練習履歴</h3>
          {takes.length === 0 ? (
            <p className="text-sm text-gray-400">まだ練習記録がありません</p>
          ) : (
            <div className="flex flex-col gap-2">
              {takes.map((take, i) => (
                <TakeItem key={take.id} take={take} index={takes.length - i} onDelete={handleDeleteTake} />
              ))}
            </div>
          )}
        </section>
      </main>
      <ConfirmDialog
        open={showRerecordConfirm}
        message="お手本を上書きしますか？元の録音は戻せません。"
        confirmLabel="再録音する"
        onConfirm={() => {
          setShowRerecordConfirm(false);
          navigate(`/phrases/${id}/reference`);
        }}
        onCancel={() => setShowRerecordConfirm(false)}
      />
      {toastMessage && (
        <Toast message={toastMessage} onDismiss={() => setToastMessage(null)} />
      )}
    </div>
  );
}
