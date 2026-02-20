/**
 * S1: フレーズ一覧（トップ画面）
 * REQ-RC-UX-001: 初回CTA, REQ-RC-UX-003: ワンタップ練習, REQ-RC-UX-005: 空状態表示
 * REQ-RC-DATA-003: Phrase即作成, REQ-RC-DATA-005: カスケード削除
 */
import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { openDB, PhraseRepository, TakeRepository } from '@lib/db';
import { usePhrases } from '../hooks/usePhrases';
import { PhraseCard } from '../components/PhraseCard';
import { EmptyState } from '../components/EmptyState';
import { ConfirmDialog } from '../components/ConfirmDialog';
import { Toast } from '../components/Toast';

export function PhraseListPage() {
  const { phrases, loading, refresh } = usePhrases();
  const navigate = useNavigate();
  const [bestScores, setBestScores] = useState<Record<string, number | null>>({});
  const [deleteTarget, setDeleteTarget] = useState<{ id: string; title: string } | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const refreshScores = useCallback(async () => {
    if (phrases.length === 0) return;
    const db = await openDB();
    const takeRepo = new TakeRepository(db);
    const scores: Record<string, number | null> = {};
    for (const phrase of phrases) {
      scores[phrase.id] = await takeRepo.getBestScore(phrase.id);
    }
    setBestScores(scores);
  }, [phrases]);

  useEffect(() => {
    refreshScores();
  }, [refreshScores]);

  const handleCreate = async () => {
    try {
      const db = await openDB();
      const repo = new PhraseRepository(db);
      const phrase = await repo.create();
      navigate(`/phrases/${phrase.id}/reference`);
    } catch {
      setToastMessage('保存に失敗しました');
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      const db = await openDB();
      const repo = new PhraseRepository(db);
      await repo.delete(deleteTarget.id);
      setDeleteTarget(null);
      await refresh();
    } catch {
      setDeleteTarget(null);
      setToastMessage('削除に失敗しました');
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p className="text-gray-500">読み込み中...</p>
      </div>
    );
  }

  return (
    <div className="mx-auto min-h-screen max-w-lg bg-gray-50 pb-20">
      <header className="sticky top-0 z-10 bg-white px-4 py-3 shadow-sm">
        <h1 className="text-xl font-bold text-gray-900">RiffCard</h1>
      </header>

      <main className="p-4">
        {phrases.length === 0 ? (
          <EmptyState
            message="練習したいフレーズを録音しましょう"
            actionLabel="最初のフレーズを録音"
            onAction={handleCreate}
          />
        ) : (
          <div className="flex flex-col gap-3">
            {phrases.map((phrase) => (
              <PhraseCard
                key={phrase.id}
                id={phrase.id}
                title={phrase.title}
                bestScore={bestScores[phrase.id] ?? null}
                onDelete={(id) =>
                  setDeleteTarget({ id, title: phrase.title })
                }
              />
            ))}
          </div>
        )}
      </main>

      {/* FAB */}
      <button
        onClick={handleCreate}
        className="fixed bottom-6 right-6 flex h-14 w-14 items-center justify-center rounded-full bg-rose-500 text-2xl text-white shadow-lg hover:bg-rose-600"
        aria-label="新しいフレーズを作成"
      >
        +
      </button>

      <ConfirmDialog
        open={deleteTarget !== null}
        message={`「${deleteTarget?.title}」を削除しますか？練習履歴もすべて削除されます。`}
        confirmLabel="削除"
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
      />
      {toastMessage && (
        <Toast message={toastMessage} onDismiss={() => setToastMessage(null)} />
      )}
    </div>
  );
}
