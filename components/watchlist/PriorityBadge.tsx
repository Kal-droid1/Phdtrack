"use client";

import { useState, useRef, useEffect } from "react";
import { Priority } from "@/types";

interface PriorityBadgeProps {
  priority: Priority;
  onUpdate: (priority: Priority) => void;
}

const PRIORITY_CONFIG: Record<Priority, { label: string; bg: string; text: string; dot: string; hover: string }> = {
  urgent: { label: "Urgent", bg: "bg-red-100", text: "text-red-800", dot: "bg-red-600", hover: "hover:bg-red-200" },
  high: { label: "High", bg: "bg-orange-100", text: "text-orange-800", dot: "bg-orange-600", hover: "hover:bg-orange-200" },
  normal: { label: "Normal", bg: "bg-gray-100", text: "text-gray-600", dot: "bg-gray-500", hover: "hover:bg-gray-200" },
  low: { label: "Low", bg: "bg-slate-100", text: "text-slate-600", dot: "bg-slate-500", hover: "hover:bg-slate-200" },
};

const PRIORITY_ORDER: Priority[] = ["urgent", "high", "normal", "low"];

export default function PriorityBadge({ priority, onUpdate }: PriorityBadgeProps) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    if (open) {
      document.addEventListener("mousedown", handleClickOutside);
      return () => document.removeEventListener("mousedown", handleClickOutside);
    }
  }, [open]);

  const config = PRIORITY_CONFIG[priority];

  return (
    <div ref={ref} className="relative inline-flex">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-xs font-medium transition-all duration-200 ${config.bg} ${config.text} ${config.hover}`}
      >
        <span className={`w-1.5 h-1.5 rounded-full ${config.dot}`} />
        {config.label}
      </button>

      {open && (
        <div className="absolute left-0 top-full mt-1 z-50 w-32 bg-white rounded-xl shadow-lg border border-gray-100 py-1 overflow-hidden">
          {PRIORITY_ORDER.map((p) => {
            const c = PRIORITY_CONFIG[p];
            const isActive = p === priority;
            return (
              <button
                key={p}
                type="button"
                onClick={() => { onUpdate(p); setOpen(false); }}
                className={`w-full flex items-center gap-2 px-3 py-2 text-xs font-medium transition-all duration-150 ${isActive ? `${c.bg} ${c.text}` : "text-gray-600 hover:bg-gray-50"}`}
              >
                <span className={`w-1.5 h-1.5 rounded-full ${c.dot}`} />
                {c.label}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
