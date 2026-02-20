/**
 * S4: 練習録音画面
 * REQ-RC-REC-005: 練習録音→自動分析, REQ-RC-PITCH-006: オフライン分析
 * REQ-RC-NFR-003: 5分録音対応
 */
import { useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { openDB, TakeRepository } from '@lib/db';
import { usePhrase } from '../hooks/usePhrase';
import { useAnalyzer } from '../hooks/useAnalyzer';
import { AudioRecorder } from '../components/AudioRecorder';
import { AudioPlayer } from '../components/AudioPlayer';
import { BackButton } from '../components/BackButton';
import { Toast } from '../components/Toast';

export function PracticeRecordPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { phrase, loading } = usePhrase(id!);
  const { state: analyzerState, error: analyzerError, analyze } = useAnalyzer();
  const [saveError, setSaveError] = useState<string | null>(null);

  const handleRecordingComplete = useCallback(
    async (blob: Blob) => {
      if (!id || !phrase?.referenceAudioBlob) return;

      try {
        const scores = await analyze(phrase.referenceAudioBlob, blob);

        try {
          const db = await openDB();
          const takeRepo = new TakeRepository(db);
          const take = await takeRepo.create(id, blob, scores);
          navigate(`/phrases/${id}/result/${take.id}`);
        } catch {
          setSaveError('保存に失敗しました');
        }
      } catch {
        // 分析エラーは useAnalyzer で管理
      }
    },
    [id, phrase, analyze, navigate],
  );

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p className="text-gray-500">読み込み中...</p>
      </div>
    );
  }

  if (analyzerState === 'analyzing') {
    return (
      <div className="mx-auto flex min-h-screen max-w-lg flex-col items-center justify-center bg-gray-50">
        <div className="h-12 w-12 animate-spin rounded-full border-4 border-rose-500 border-t-transparent" />
        <p className="mt-4 text-lg text-gray-600">分析中...</p>
      </div>
    );
  }

  if (analyzerState === 'error') {
    return (
      <div className="mx-auto flex min-h-screen max-w-lg flex-col items-center justify-center gap-4 bg-gray-50">
        <p className="text-red-500">分析に失敗しました</p>
        <p className="text-sm text-gray-500">{analyzerError?.message}</p>
        <button
          onClick={() => navigate(`/phrases/${id}/practice`)}
          className="rounded-lg bg-rose-500 px-4 py-2 text-white hover:bg-rose-600"
        >
          もう一度録音する
        </button>
      </div>
    );
  }

  return (
    <div className="mx-auto min-h-screen max-w-lg bg-gray-50">
      <header className="sticky top-0 z-10 flex items-center gap-3 bg-white px-4 py-3 shadow-sm">
        <BackButton label="練習中" />
      </header>

      <main className="p-4">
        <h2 className="mb-4 text-center text-lg font-medium text-gray-800">
          {phrase?.title ?? ''}
        </h2>

        {phrase?.referenceAudioBlob && (
          <div className="mb-6 flex justify-center">
            <AudioPlayer blob={phrase.referenceAudioBlob} label="お手本を聴く" />
          </div>
        )}

        <AudioRecorder autoStart onRecordingComplete={handleRecordingComplete} />
      </main>
      {saveError && (
        <Toast message={saveError} onDismiss={() => setSaveError(null)} />
      )}
    </div>
  );
}
