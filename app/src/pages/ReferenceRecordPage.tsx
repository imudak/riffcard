/**
 * S2: お手本録音画面
 * REQ-RC-REC-003: 録音キャプチャ, REQ-RC-REC-004: お手本保存
 * REQ-RC-DATA-004, DJ-003: 即録音開始, REQ-RC-UX-002: 初回録音完了→自動再生
 */
import { useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { openDB, PhraseRepository } from '@lib/db';
import { usePhrase } from '../hooks/usePhrase';
import { AudioRecorder } from '../components/AudioRecorder';
import { BackButton } from '../components/BackButton';
import { Toast } from '../components/Toast';

export function ReferenceRecordPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { phrase, loading } = usePhrase(id!);
  const [saveError, setSaveError] = useState<string | null>(null);

  const handleRecordingComplete = useCallback(
    async (blob: Blob) => {
      if (!id) return;
      try {
        const db = await openDB();
        const repo = new PhraseRepository(db);
        await repo.updateReference(id, blob);
        navigate(`/phrases/${id}`, { state: { fromRecording: true } });
      } catch {
        setSaveError('保存に失敗しました');
      }
    },
    [id, navigate],
  );

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p className="text-gray-500">読み込み中...</p>
      </div>
    );
  }

  return (
    <div className="mx-auto min-h-screen max-w-lg bg-gray-50">
      <header className="sticky top-0 z-10 flex items-center gap-3 bg-white px-4 py-3 shadow-sm">
        <BackButton label="お手本を録音" />
      </header>

      <main className="p-4">
        <h2 className="mb-6 text-center text-lg font-medium text-gray-800">
          {phrase?.title ?? ''}
        </h2>
        <AudioRecorder autoStart onRecordingComplete={handleRecordingComplete} />
      </main>
      {saveError && (
        <Toast message={saveError} onDismiss={() => setSaveError(null)} />
      )}
    </div>
  );
}
