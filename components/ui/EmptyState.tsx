import { Inbox } from "lucide-react";

interface EmptyStateProps {
  message: string;
  actionLabel?: string;
  onAction?: () => void;
}

export default function EmptyState({ message, actionLabel, onAction }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center text-center py-12 px-4">
      <div className="p-3.5 rounded-2xl mb-4"
        style={{
          background: "rgba(139, 92, 246, 0.1)",
          border: "1px solid rgba(139, 92, 246, 0.2)",
        }}
      >
        <Inbox size={28} style={{ color: "#8b5cf6", opacity: 0.5 }} />
      </div>

      <p className="text-white/40 text-sm max-w-xs mb-5 leading-relaxed">{message}</p>

      {actionLabel && onAction && (
        <button
          onClick={onAction}
          className="px-5 py-2.5 text-sm font-semibold text-white rounded-xl transition-all duration-200"
          style={{
            background: "linear-gradient(135deg, #8b5cf6, #14b8a6)",
          }}
        >
          {actionLabel}
        </button>
      )}
    </div>
  );
}
