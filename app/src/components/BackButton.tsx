import { useNavigate } from 'react-router-dom';

interface BackButtonProps {
  label?: string;
  /** 明示的な遷移先。省略時はブラウザ履歴を遡る */
  to?: string;
}

export function BackButton({ label = '戻る', to }: BackButtonProps) {
  const navigate = useNavigate();
  return (
    <button
      onClick={() => (to ? navigate(to) : navigate(-1))}
      className="flex items-center gap-1 text-sm text-gray-600 hover:text-gray-900"
    >
      <span aria-hidden="true">&larr;</span>
      <span>{label}</span>
    </button>
  );
}
