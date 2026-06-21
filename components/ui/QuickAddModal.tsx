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
        className="absolute inset-0 bg-ink/40 backdrop-blur-sm"
        onClick={onClose}
        aria-hidden="true"
      />

      <div
        className="relative z-50 w-full max-w-md bg-white rounded-2xl shadow-warm-lg p-6"
        role="dialog"
        aria-modal="true"
      >
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-base font-semibold text-ink tracking-tight">Quick Add</h2>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-ink-muted hover:text-ink hover:bg-cream transition-colors"
            aria-label="Close"
          >
            <X size={18} />
          </button>
        </div>

        <p className="text-sm text-ink-light mb-3 leading-relaxed">
          Describe the entry in plain text and let AI fill the form.
        </p>

        <textarea
          rows={5}
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Describe the application or professor in plain text... e.g. Prof. Diener at UEF Finland, contacted June 10, no reply yet"
          className="w-full rounded-xl border border-border px-3.5 py-2.5 text-sm resize-none"
        />

        {error && (
          <div className="mt-3 text-sm text-rose bg-rose/5 rounded-xl p-3 border border-rose/10">
            {error}
          </div>
        )}

        <div className="flex items-center justify-end gap-3 mt-5">
          <button
            onClick={onClose}
            className="px-4 py-2.5 text-sm font-medium text-ink-light border border-border rounded-xl hover:bg-cream transition-all duration-200"
          >
            Cancel
          </button>
          <button
            onClick={() => onParse(text)}
            disabled={loading || !text.trim()}
            className="flex items-center gap-2 px-4 py-2.5 text-sm font-semibold text-white bg-brand rounded-xl hover:bg-brand-hover transition-all duration-200 disabled:opacity-50"
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
