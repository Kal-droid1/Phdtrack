import { Inbox } from "lucide-react";

interface EmptyStateProps {
  message: string;
  actionLabel?: string;
  onAction?: () => void;
}

export default function EmptyState({ message, actionLabel, onAction }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center text-center py-12 px-4">
      <div className="p-3.5 rounded-2xl bg-brand-light text-brand/50 mb-4">
        <Inbox size={28} />
      </div>

      <p className="text-ink-light text-sm max-w-xs mb-5 leading-relaxed">{message}</p>

      {actionLabel && onAction && (
        <button
          onClick={onAction}
          className="px-5 py-2.5 text-sm font-semibold text-white bg-brand rounded-xl hover:bg-brand-hover transition-all duration-200 shadow-warm"
        >
          {actionLabel}
        </button>
      )}
    </div>
  );
}
