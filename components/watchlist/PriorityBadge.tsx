"use client";

import { useState, useRef, useEffect } from "react";
import { Priority } from "@/types";

interface PriorityBadgeProps {
  priority: Priority;
  onUpdate: (priority: Priority) => void;
}

const PRIORITY_CONFIG: Record<Priority, { label: string; bg: string; text: string; dot: string; hover: string }> = {
  urgent: { label: "Urgent", bg: "bg-red-50", text: "text-red-700", dot: "bg-red-500", hover: "hover:bg-red-100" },
  high: { label: "High", bg: "bg-orange-50", text: "text-orange-700", dot: "bg-orange-500", hover: "hover:bg-orange-100" },
  normal: { label: "Normal", bg: "bg-gray-50", text: "text-gray-500", dot: "bg-gray-400", hover: "hover:bg-gray-100" },
  low: { label: "Low", bg: "bg-blue-50", text: "text-blue-600", dot: "bg-blue-400", hover: "hover:bg-blue-100" },
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
