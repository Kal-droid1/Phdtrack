"use client";

import { useMemo } from "react";

interface AppItem {
  id: string;
  name: string;
  status: string;
  deadline: string | null;
  open_date: string | null;
}

interface WatchlistItem {
  name: string;
  expected_open_date: string | null;
  expected_deadline: string | null;
}

interface Props {
  applications: AppItem[];
  watchlistItems: WatchlistItem[];
}

interface Row {
  id: string;
  name: string;
  startDate: Date | null;
  endDate: Date | null;
  color: string;
  type: "application" | "watchlist";
}

const STATUS_COLORS: Record<string, string> = {
  Applied: "#6366f1",
  Watching: "#f59e0b",
  Rejected: "#ef4444",
  "Under Review": "#06b6d4",
  Accepted: "#10b981",
  Waitlisted: "#9ca3af",
};

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

function formatShort(d: Date): string {
  return `${MONTHS[d.getMonth()]} ${d.getFullYear()}`;
}

function formatDateShort(d: Date): string {
  return `${d.getDate()} ${MONTHS[d.getMonth()]}`;
}

function addMonths(date: Date, n: number): Date {
  const d = new Date(date);
  d.setMonth(d.getMonth() + n);
  return d;
}

function truncate(str: string, max: number): string {
  return str.length <= max ? str : str.slice(0, max) + "…";
}

export default function TimelineChart({ applications, watchlistItems }: Props) {
  const rows: Row[] = useMemo(() => {
    const appRows: Row[] = applications
      .filter((a) => a.deadline || a.open_date)
      .map((a) => ({
        id: `app-${a.id}`,
        name: a.name,
        startDate: a.open_date ? new Date(a.open_date) : null,
        endDate: a.deadline ? new Date(a.deadline) : null,
        color: STATUS_COLORS[a.status] ?? "#9ca3af",
        type: "application" as const,
      }));

    const watchRows: Row[] = watchlistItems
      .filter((w) => w.expected_open_date || w.expected_deadline)
      .map((w, i) => ({
        id: `watch-${i}`,
        name: w.name,
        startDate: w.expected_open_date ? new Date(w.expected_open_date) : null,
        endDate: w.expected_deadline ? new Date(w.expected_deadline) : null,
        color: "#8b5cf6",
        type: "watchlist" as const,
      }));

    return [...appRows, ...watchRows];
  }, [applications, watchlistItems]);

  const { minTime, maxTime } = useMemo(() => {
    let min = Infinity;
    let max = -Infinity;

    for (const r of rows) {
      if (r.startDate) {
        const t = r.startDate.getTime();
        if (t < min) min = t;
        if (t > max) max = t;
      }
      if (r.endDate) {
        const t = r.endDate.getTime();
        if (t < min) min = t;
        if (t > max) max = t;
      }
    }

    if (min === Infinity) {
      const now = Date.now();
      return { minTime: now - 90 * 24 * 60 * 60 * 1000, maxTime: now + 90 * 24 * 60 * 60 * 1000 };
    }

    return {
      minTime: addMonths(new Date(min), -2).getTime(),
      maxTime: addMonths(new Date(max), 2).getTime(),
    };
  }, [rows]);

  const range = maxTime - minTime;
  const todayMs = Date.now();
  const totalWidth = Math.max(700, rows.length * 140);

  function toPx(t: number): number {
    return ((t - minTime) / range) * totalWidth;
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
      <div className="flex items-center justify-center py-16">
        <p className="text-sm text-gray-400">No timeline data available.</p>
      </div>
    );
  }

  return (
    <div>
      {/* Month axis */}
      <div className="flex ml-[170px] relative" style={{ width: totalWidth }}>
        {ticks.map((t, i) => {
          const px = toPx(t.getTime());
          const showLabel = px > 40 && (i === 0 || px - toPx(ticks[i - 1].getTime()) > 60);
          return (
            <div
              key={i}
              className="absolute text-[10px] text-gray-400 tabular-nums font-medium -translate-x-1/2 whitespace-nowrap"
              style={{ left: `${px}px` }}
            >
              {showLabel ? formatShort(t) : ""}
            </div>
          );
        })}

        {/* Today label */}
        {showToday && (
          <div
            className="absolute -translate-x-1/2 -top-0.5 whitespace-nowrap z-20"
            style={{ left: `${toPx(todayMs)}px` }}
          >
            <span className="text-[10px] font-bold text-rose-500 bg-rose-50 px-1.5 py-0.5 rounded-md">
              Today
            </span>
          </div>
        )}
      </div>

      {/* Scrollable rows area */}
      <div className="overflow-x-auto overflow-y-visible mt-1 pb-2 -mx-1 px-1">
        {/* Axis labels spacer row */}
        <div className="flex relative h-0" style={{ width: totalWidth, marginLeft: 170 }}>
          {ticks.map((t, i) => (
            <div
              key={i}
              className="absolute top-0 w-px bg-gray-100"
              style={{ left: `${toPx(t.getTime())}px`, height: rows.length * 52 + 8 }}
            />
          ))}
          {showToday && (
            <div
              className="absolute top-0 z-10"
              style={{
                left: `${toPx(todayMs)}px`,
                height: rows.length * 52 + 8,
                borderLeft: "2px dashed #ef4444",
              }}
            />
          )}
        </div>

        {/* Rows */}
        <div style={{ minWidth: totalWidth + 170 }}>
          {rows.map((row, idx) => {
            const barLeft = row.startDate
              ? toPx(row.startDate.getTime())
              : row.endDate
              ? toPx(addMonths(row.endDate, -1).getTime())
              : 0;

            const barWidth = row.startDate && row.endDate
              ? Math.max(6, toPx(row.endDate.getTime()) - toPx(row.startDate.getTime()))
              : 6;

            const dateLabel = row.endDate
              ? formatDateShort(row.endDate)
              : row.startDate
              ? formatDateShort(row.startDate)
              : "";

            const barLabel = row.startDate && row.endDate
              ? `${formatDateShort(row.startDate)} → ${dateLabel}`
              : dateLabel;

            return (
              <div
                key={row.id}
                className="flex items-center"
                style={{ height: 46 }}
              >
                {/* Name label */}
                <div className="w-[170px] shrink-0 pr-3 flex items-center gap-2">
                  <span
                    className="block text-xs font-medium text-gray-700 truncate"
                    title={row.name}
                  >
                    {truncate(row.name, 20)}
                  </span>
                  {row.type === "watchlist" && (
                    <span className="text-[10px] font-semibold uppercase tracking-wider text-purple-500 bg-purple-50 px-1.5 py-0.5 rounded shrink-0">
                      W
                    </span>
                  )}
                </div>

                {/* Bar track */}
                <div className="relative" style={{ width: totalWidth, height: 32 }}>
                  {idx % 2 === 0 && (
                    <div
                      className="absolute inset-0 bg-gray-50/60 rounded-lg"
                      style={{ width: totalWidth }}
                    />
                  )}

                  {/* Bar */}
                  <div
                    className="absolute top-1/2 -translate-y-1/2 rounded-full flex items-center shadow-sm transition-all duration-300 hover:shadow-md hover:scale-y-110"
                    style={{
                      left: `${barLeft}px`,
                      width: `${barWidth}px`,
                      height: 32,
                      backgroundColor: row.color,
                      minWidth: 8,
                    }}
                  >
                    <span
                      className="text-[11px] font-semibold text-white px-3 truncate w-full text-center tracking-tight"
                      title={barLabel}
                    >
                      {dateLabel}
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Legend */}
      <div className="flex items-center gap-4 mt-4 pt-3 border-t border-gray-100">
        <div className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-indigo-500" />
          <span className="text-[11px] text-gray-500">Applied</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-amber-400" />
          <span className="text-[11px] text-gray-500">Watching</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-red-500" />
          <span className="text-[11px] text-gray-500">Rejected</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-cyan-500" />
          <span className="text-[11px] text-gray-500">Under Review</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
          <span className="text-[11px] text-gray-500">Accepted</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-5 border-t-2 border-dashed border-red-400" />
          <span className="text-[11px] text-gray-500">Today</span>
        </div>
      </div>
    </div>
  );
}
