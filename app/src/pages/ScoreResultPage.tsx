import { useParams, useNavigate } from 'react-router-dom';
import { useTakes } from '../hooks/useTakes';
import { ScoreDisplay } from '../components/ScoreDisplay';
import { AudioPlayer } from '../components/AudioPlayer';
import { BackButton } from '../components/BackButton';

export function ScoreResultPage() {
  const { id, takeId } = useParams<{ id: string; takeId: string }>();
  const navigate = useNavigate();
  const { takes, loading } = useTakes(id!);

  const take = takes.find((t) => t.id === takeId);

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

        <hr className="w-full border-gray-200" />

        <div className="flex w-full flex-col gap-3">
          <button
            onClick={() => navigate(`/phrases/${id}/practice`)}
            className="w-full rounded-lg bg-rose-500 py-4 text-lg font-semibold text-white hover:bg-rose-600"
          >
            もう一度
          </button>
          <AudioPlayer blob={take.audioBlob} label="録音を聴く" />
          <button
            onClick={() => navigate(`/phrases/${id}`)}
            className="w-full rounded-lg border border-gray-300 py-3 text-gray-600 hover:bg-gray-100"
          >
            フレーズに戻る
          </button>
        </div>
      </main>
    </div>
  );
}
