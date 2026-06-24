"use client";

import { useMemo } from "react";

interface TimelineItem {
  name: string;
  expected_open_date: string | null;
  expected_deadline: string | null;
}

interface Props {
  items: TimelineItem[];
}

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

function formatShort(d: Date): string {
  return `${MONTHS[d.getMonth()]} ${d.getFullYear()}`;
}

function addMonths(date: Date, n: number): Date {
  const d = new Date(date);
  d.setMonth(d.getMonth() + n);
  return d;
}

function startOfMonth(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), 1);
}

function endOfMonth(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth() + 1, 0, 23, 59, 59, 999);
}

export default function TimelineChart({ items }: Props) {
  const rows = useMemo(() => {
    return items.map((item, idx) => ({
      id: idx,
      name: item.name,
      openDate: item.expected_open_date ? new Date(item.expected_open_date) : null,
      deadlineDate: item.expected_deadline ? new Date(item.expected_deadline) : null,
      hasAnyDate: !!item.expected_open_date || !!item.expected_deadline,
    }));
  }, [items]);

  const { minTime, maxTime } = useMemo(() => {
    let min = Infinity;
    let max = -Infinity;

    for (const r of rows) {
      if (!r.hasAnyDate) continue;
      const o = r.openDate?.getTime();
      const d = r.deadlineDate?.getTime();
      if (o !== undefined) { if (o < min) min = o; if (o > max) max = o; }
      if (d !== undefined) { if (d < min) min = d; if (d > max) max = d; }
    }

    if (min === Infinity) {
      const now = Date.now();
      return { minTime: now - 30 * 24 * 60 * 60 * 1000, maxTime: now + 30 * 24 * 60 * 60 * 1000 };
    }

    return {
      minTime: addMonths(new Date(min), -1).getTime(),
      maxTime: addMonths(new Date(max), 1).getTime(),
    };
  }, [rows]);

  const range = maxTime - minTime;
  const todayMs = Date.now();

  function toPct(t: number): number {
    return ((t - minTime) / range) * 100;
  }

  const ticks = useMemo(() => {
    const start = new Date(minTime);
    const end = new Date(maxTime);
    const result: Date[] = [];
    const cursor = new Date(start.getFullYear(), start.getMonth(), 1);
    while (cursor <= end) {
      result.push(new Date(cursor));
      cursor.setMonth(cursor.getMonth() + 1);
    }
    return result;
  }, [minTime, maxTime]);

  const showToday = todayMs >= minTime && todayMs <= maxTime;

  if (rows.length === 0) {
    return (
      <div className="flex items-center justify-center h-full">
        <p className="text-sm text-gray-400">No watchlist items.</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      {/* Month axis */}
      <div className="flex h-5 shrink-0">
        <div className="w-[150px] shrink-0" />
        <div className="flex-1 relative">
          {ticks.map((t, i) => {
            const pct = toPct(t.getTime());
            const showLabel = i === 0 || i === ticks.length - 1;
            return (
              <div
                key={i}
                className="absolute text-[10px] text-gray-400 tabular-nums -translate-x-1/2 top-0"
                style={{ left: `${pct}%` }}
              >
                {showLabel ? formatShort(t) : ""}
              </div>
            );
          })}

          {/* Today label */}
          {showToday && (
            <div
              className="absolute -translate-x-1/2 top-0 whitespace-nowrap"
              style={{ left: `${toPct(todayMs)}%` }}
            >
              <span className="text-[10px] font-semibold text-rose-500">Today</span>
            </div>
          )}
        </div>
      </div>

      {/* Rows area */}
      <div className="flex-1 relative min-h-0">
        {/* Grid lines + Today line (single layer) */}
        <div className="absolute inset-0 left-[150px] pointer-events-none" style={{ zIndex: 0 }}>
          {ticks.map((t, i) => (
            <div
              key={i}
              className="absolute top-0 bottom-0 w-px bg-gray-100"
              style={{ left: `${toPct(t.getTime())}%` }}
            />
          ))}
          {showToday && (
            <div
              className="absolute top-0 bottom-0 w-0.5 bg-rose-400 z-10"
              style={{ left: `${toPct(todayMs)}%` }}
            />
          )}
        </div>

        {/* Rows */}
        {rows.map((row, idx) => (
          <div
            key={row.id}
            className={`flex items-center h-9 ${idx % 2 === 1 ? "bg-gray-50/50" : ""}`}
            style={{ position: "relative", zIndex: 1 }}
          >
            {/* Name label */}
            <div className="w-[150px] shrink-0 pr-3 overflow-hidden">
              <span
                className="block text-xs font-medium text-gray-700 truncate"
                title={row.name}
              >
                {row.name}
              </span>
            </div>

            {/* Bar */}
            <div className="flex-1 relative h-full">
              {!row.hasAnyDate ? (
                <span className="absolute inset-0 flex items-center text-[11px] text-gray-400 pl-1">
                  No dates set
                </span>
              ) : row.openDate && row.deadlineDate ? (
                <div
                  className="absolute top-1/2 -translate-y-1/2 h-3 rounded-full"
                  style={{
                    left: `${toPct(row.openDate.getTime())}%`,
                    width: `${toPct(row.deadlineDate.getTime()) - toPct(row.openDate.getTime())}%`,
                    minWidth: 4,
                    backgroundColor: "#14b8a6",
                  }}
                />
              ) : row.deadlineDate && !row.openDate ? (
                <div
                  className="absolute top-1/2 -translate-y-1/2 h-3 rounded-l-full"
                  style={{
                    left: `${toPct(startOfMonth(row.deadlineDate).getTime())}%`,
                    width: `${toPct(row.deadlineDate.getTime()) - toPct(startOfMonth(row.deadlineDate).getTime())}%`,
                    minWidth: 4,
                    border: "2px dashed #14b8a6",
                    borderRight: "none",
                  }}
                />
              ) : row.openDate && !row.deadlineDate ? (
                <div
                  className="absolute top-1/2 -translate-y-1/2 h-3 rounded-r-full"
                  style={{
                    left: `${toPct(row.openDate.getTime())}%`,
                    width: `${toPct(endOfMonth(row.openDate).getTime()) - toPct(row.openDate.getTime())}%`,
                    minWidth: 4,
                    border: "2px dashed #14b8a6",
                    borderLeft: "none",
                  }}
                />
              ) : null}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
