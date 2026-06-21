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
        className="absolute inset-0 backdrop-blur-sm"
        style={{ background: "rgba(0,0,0,0.6)" }}
        onClick={onClose}
        aria-hidden="true"
      />

      <div
        className="relative z-50 w-full max-w-md rounded-2xl p-6"
        style={{
          background: "#0f0f17",
          border: "1px solid rgba(255,255,255,0.1)",
          boxShadow: "0 20px 60px rgba(0,0,0,0.5)",
        }}
        role="dialog"
        aria-modal="true"
      >
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-base font-semibold text-white/80 tracking-tight">Quick Add</h2>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-white/30 hover:text-white hover:bg-white/5 transition-colors"
            aria-label="Close"
          >
            <X size={18} />
          </button>
        </div>

        <p className="text-sm text-white/40 mb-3 leading-relaxed">
          Describe the entry in plain text and let AI fill the form.
        </p>

        <textarea
          rows={5}
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Describe the application or professor in plain text... e.g. Prof. Diener at UEF Finland, contacted June 10, no reply yet"
          className="w-full rounded-xl px-3.5 py-2.5 text-sm resize-none"
        />

        {error && (
          <div className="mt-3 text-sm rounded-xl p-3"
            style={{
              color: "#f43f5e",
              background: "rgba(244, 63, 94, 0.1)",
              border: "1px solid rgba(244, 63, 94, 0.2)",
            }}
          >
            {error}
          </div>
        )}

        <div className="flex items-center justify-end gap-3 mt-5">
          <button
            onClick={onClose}
            className="px-4 py-2.5 text-sm font-medium rounded-xl transition-all duration-200"
            style={{
              color: "rgba(255,255,255,0.5)",
              background: "rgba(255,255,255,0.05)",
              border: "1px solid rgba(255,255,255,0.1)",
            }}
          >
            Cancel
          </button>
          <button
            onClick={() => onParse(text)}
            disabled={loading || !text.trim()}
            className="flex items-center gap-2 px-4 py-2.5 text-sm font-semibold text-white rounded-xl transition-all duration-200 disabled:opacity-50"
            style={{
              background: "linear-gradient(135deg, #8b5cf6, #14b8a6)",
            }}
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
