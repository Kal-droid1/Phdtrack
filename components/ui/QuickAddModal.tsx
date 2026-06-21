"use client";

import { useEffect, useState } from "react";
import { Wand2, Loader2, X } from "lucide-react";

interface QuickAddModalProps {
  isOpen: boolean;
  onClose: () => void;
  onParse: (text: string) => void;
  loading: boolean;
  error: string | null;
}

export default function QuickAddModal({
  isOpen,
  onClose,
  onParse,
  loading,
  error,
}: QuickAddModalProps) {
  const [text, setText] = useState("");

  useEffect(() => {
    if (!isOpen) setText("");
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;

    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };

    document.addEventListener("keydown", handleEscape);
    return () => document.removeEventListener("keydown", handleEscape);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div
        className="absolute inset-0 bg-black/50"
        onClick={onClose}
        aria-hidden="true"
      />

      <div
        className="relative z-50 w-full max-w-md mx-4 bg-white rounded-lg shadow-lg p-6"
        role="dialog"
        aria-modal="true"
      >
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-[#2d3436]">Quick Add</h2>
          <button
            onClick={onClose}
            className="p-1 rounded-md text-gray-500 hover:bg-gray-100 transition-colors"
            aria-label="Close"
          >
            <X size={20} />
          </button>
        </div>

        <p className="text-sm text-gray-600 mb-3">
          Describe the entry in plain text and let AI fill the form.
        </p>

        <textarea
          rows={5}
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Describe the application or professor in plain text... e.g. Prof. Diener at UEF Finland, contacted June 10, no reply yet"
          className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#4a7c59] focus:border-transparent resize-none"
        />

        {error && (
          <div className="mt-3 text-sm text-red-600 bg-red-50 rounded-md p-2">
            {error}
          </div>
        )}

        <div className="flex items-center justify-end gap-3 mt-5">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-gray-700 border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={() => onParse(text)}
            disabled={loading || !text.trim()}
            className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-[#4a7c59] rounded-md hover:bg-[#3e6b4b] transition-colors disabled:opacity-50"
          >
            {loading ? (
              <Loader2 size={18} className="animate-spin" />
            ) : (
              <Wand2 size={18} />
            )}
            {loading ? "Parsing..." : "Parse with AI"}
          </button>
        </div>
      </div>
    </div>
  );
}
