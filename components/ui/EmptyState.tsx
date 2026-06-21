import { Inbox } from "lucide-react";

interface EmptyStateProps {
  message: string;
  actionLabel?: string;
  onAction?: () => void;
}

export default function EmptyState({ message, actionLabel, onAction }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center text-center py-12 px-4">
      <div className="p-3.5 rounded-2xl bg-indigo-50 mb-4">
        <Inbox size={28} className="text-indigo-400" />
      </div>

      <p className="text-gray-400 text-sm max-w-xs mb-5 leading-relaxed">{message}</p>

      {actionLabel && onAction && (
        <button
          onClick={onAction}
          className="px-5 py-2.5 text-sm font-semibold text-white rounded-xl transition-all duration-200 shadow-md hover:shadow-lg"
          style={{
            background: "linear-gradient(135deg, #6366f1, #8b5cf6)",
          }}
        >
          {actionLabel}
        </button>
      )}
    </div>
  );
}
