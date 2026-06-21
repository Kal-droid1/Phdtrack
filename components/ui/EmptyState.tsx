import { Inbox } from "lucide-react";

interface EmptyStateProps {
  message: string;
  actionLabel?: string;
  onAction?: () => void;
}

export default function EmptyState({ message, actionLabel, onAction }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center text-center py-16 px-4">
      <div className="p-4 rounded-full bg-gray-100 text-gray-400 mb-4">
        <Inbox size={32} />
      </div>

      <p className="text-gray-600 text-sm max-w-xs mb-4">{message}</p>

      {actionLabel && onAction && (
        <button
          onClick={onAction}
          className="px-4 py-2 text-sm font-medium text-white bg-[#4a7c59] rounded-md hover:bg-[#3e6b4b] transition-colors"
        >
          {actionLabel}
        </button>
      )}
    </div>
  );
}
