import { useEffect } from 'react';

interface ToastProps {
  message: string;
  action?: {
    label: string;
    onClick: () => void;
  };
  onDismiss: () => void;
  duration?: number;
}

export function Toast({ message, action, onDismiss, duration = 5000 }: ToastProps) {
  useEffect(() => {
    if (!action) {
      const timer = setTimeout(onDismiss, duration);
      return () => clearTimeout(timer);
    }
  }, [action, onDismiss, duration]);

  return (
    <div className="fixed bottom-4 left-4 right-4 z-50 flex items-center justify-between gap-3 rounded-lg bg-gray-800 px-4 py-3 text-sm text-white shadow-lg sm:left-auto sm:right-4 sm:max-w-sm">
      <span>{message}</span>
      <div className="flex shrink-0 gap-2">
        {action && (
          <button
            onClick={action.onClick}
            className="font-semibold text-[#e94560] hover:text-[#ff6b81]"
          >
            {action.label}
          </button>
        )}
        <button
          onClick={onDismiss}
          className="text-gray-400 hover:text-white"
          aria-label="閉じる"
        >
          ✕
        </button>
      </div>
    </div>
  );
}
