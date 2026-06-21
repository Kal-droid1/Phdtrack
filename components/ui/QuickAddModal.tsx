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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        className="absolute inset-0 backdrop-blur-sm bg-black/40"
        onClick={onClose}
        aria-hidden="true"
      />

      <div className="relative z-50 w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl border border-gray-100" role="dialog" aria-modal="true">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-base font-semibold text-gray-900 tracking-tight">Quick Add</h2>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors"
            aria-label="Close"
          >
            <X size={18} />
          </button>
        </div>

        <p className="text-sm text-gray-500 mb-3 leading-relaxed">
          Describe the entry in plain text and let AI fill the form.
        </p>

        <textarea
          rows={5}
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Describe the application or professor in plain text... e.g. Prof. Diener at UEF Finland, contacted June 10, no reply yet"
          className="w-full rounded-xl px-3.5 py-2.5 text-sm resize-none border-gray-200"
        />

        {error && (
          <div className="mt-3 text-sm rounded-xl p-3 bg-red-50 text-red-700 border border-red-200">
            {error}
          </div>
        )}

        <div className="flex items-center justify-end gap-3 mt-5">
          <button
            onClick={onClose}
            className="px-4 py-2.5 text-sm font-medium rounded-xl text-gray-500 bg-gray-50 border border-gray-200 hover:bg-gray-100 transition-all duration-200"
          >
            Cancel
          </button>
          <button
            onClick={() => onParse(text)}
            disabled={loading || !text.trim()}
            className="flex items-center gap-2 px-4 py-2.5 text-sm font-semibold text-white rounded-xl transition-all duration-200 disabled:opacity-50 shadow-md hover:shadow-lg"
            style={{ background: "linear-gradient(135deg, #6366f1, #8b5cf6)" }}
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
