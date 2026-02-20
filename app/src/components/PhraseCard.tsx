/** REQ-RC-UX-003: ワンタップ練習開始 */
import { useNavigate } from 'react-router-dom';

interface PhraseCardProps {
  id: string;
  title: string;
  bestScore: number | null;
  onDelete: (id: string) => void;
}

export function PhraseCard({ id, title, bestScore, onDelete }: PhraseCardProps) {
  const navigate = useNavigate();

  return (
    <div
      className="flex items-center justify-between rounded-lg border border-gray-200 bg-white p-4 shadow-sm"
      onClick={() => navigate(`/phrases/${id}`)}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => e.key === 'Enter' && navigate(`/phrases/${id}`)}
    >
      <div className="min-w-0 flex-1">
        <h3 className="truncate font-medium text-gray-900">{title}</h3>
        <p className="text-sm text-gray-500">
          Best: {bestScore !== null ? `${bestScore}点` : '--'}
        </p>
      </div>
      <div className="flex items-center gap-2 ml-3">
        <button
          onClick={(e) => {
            e.stopPropagation();
            navigate(`/phrases/${id}/practice`);
          }}
          className="rounded-lg bg-rose-500 px-3 py-1.5 text-sm text-white hover:bg-rose-600"
        >
          練習する
        </button>
        <button
          onClick={(e) => {
            e.stopPropagation();
            onDelete(id);
          }}
          className="rounded p-1.5 text-gray-400 hover:bg-red-50 hover:text-red-500"
          aria-label={`${title}を削除`}
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
          </svg>
        </button>
      </div>
    </div>
  );
}
