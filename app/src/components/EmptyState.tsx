/** REQ-RC-UX-001: 初回CTA, REQ-RC-UX-005: 空状態表示 */
interface EmptyStateProps {
  icon?: string;
  message: string;
  actionLabel: string;
  onAction: () => void;
}

export function EmptyState({
  icon = '\uD83C\uDFA4',
  message,
  actionLabel,
  onAction,
}: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center gap-4 py-16">
      <span className="text-5xl" role="img" aria-label="icon">{icon}</span>
      <p className="text-center text-gray-600">{message}</p>
      <button
        onClick={onAction}
        className="rounded-lg bg-rose-500 px-6 py-3 text-white font-semibold hover:bg-rose-600"
      >
        {actionLabel}
      </button>
    </div>
  );
}
