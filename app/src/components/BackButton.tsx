import { useNavigate } from 'react-router-dom';

export function BackButton({ label = '戻る' }: { label?: string }) {
  const navigate = useNavigate();
  return (
    <button
      onClick={() => navigate(-1)}
      className="flex items-center gap-1 text-sm text-gray-600 hover:text-gray-900"
    >
      <span aria-hidden="true">&larr;</span>
      <span>{label}</span>
    </button>
  );
}
