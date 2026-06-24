"use client";

import { useMemo } from "react";

interface WatchlistItem {
  name: string;
  expected_open_date: string | null;
  expected_deadline: string | null;
}

interface Props {
  items: WatchlistItem[];
}

interface Row {
  id: number;
  name: string;
  openDate: Date | null;
  deadlineDate: Date | null;
}

const MONTHS = [
  "Jan", "Feb", "Mar", "Apr", "May", "Jun",
  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
];

function formatShort(d: Date): string {
  return `${MONTHS[d.getMonth()]} ${d.getFullYear()}`;
}

function toMs(d: Date | null): number | null {
  return d ? d.getTime() : null;
}

export default function WatchlistGantt({ items }: Props) {
  const rows: Row[] = useMemo(() => {
    let id = 0;
    return items
      .filter(
        (i) => i.expected_open_date || i.expected_deadline
      )
      .map((i) => ({
        id: id++,
        name: i.name,
        openDate: i.expected_open_date ? new Date(i.expected_open_date) : null,
        deadlineDate: i.expected_deadline
          ? new Date(i.expected_deadline)
          : null,
      }));
  }, [items]);

  const { minTime, maxTime } = useMemo(() => {
    let min = Infinity;
    let max = -Infinity;
    for (const r of rows) {
      const o = toMs(r.openDate);
      const d = toMs(r.deadlineDate);
      if (o !== null) {
        if (o < min) min = o;
        if (o > max) max = o;
      }
      if (d !== null) {
        if (d < min) min = d;
        if (d > max) max = d;
      }
    }
    // Add padding
    const pad = max > min ? (max - min) * 0.08 : 31 * 24 * 60 * 60 * 1000;
    return { minTime: min - pad, maxTime: max + pad };
  }, [rows]);

  const range = maxTime - minTime;

  function toPct(t: number): number {
    return ((t - minTime) / range) * 100;
  }

  // Generate tick marks for the time axis
  const ticks = useMemo(() => {
    if (rows.length === 0) return [];
    const start = new Date(minTime);
    const end = new Date(maxTime);
    const ticks: Date[] = [];

    // Start from the beginning of the start month, go month by month
    const cursor = new Date(start.getFullYear(), start.getMonth(), 1);
    while (cursor <= end) {
      ticks.push(new Date(cursor));
      cursor.setMonth(cursor.getMonth() + 1);
    }
    return ticks;
  }, [minTime, maxTime, rows.length]);

  if (rows.length === 0) {
    return (
      <div className="bg-white rounded-2xl shadow-lg border-l-[4px] border-cyan-500 p-5 md:p-6">
        <h2 className="text-xs font-semibold uppercase tracking-[0.2em] text-gray-700 mb-5">
          Watchlist Timeline
        </h2>
        <p className="text-sm text-gray-400">No watchlist items with dates.</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl shadow-lg border-l-[4px] border-cyan-500 p-5 md:p-6">
      <h2 className="text-xs font-semibold uppercase tracking-[0.2em] text-gray-700 mb-4">
        Watchlist Timeline
      </h2>

      {/* Time axis */}
      <div className="flex mb-1 ml-[140px]">
        {ticks.map((t, i) => {
          const pct = toPct(t.getTime());
          const show =
            i === 0 ||
            i === ticks.length - 1 ||
            pct - toPct(ticks[i - 1].getTime()) > 4;
          return (
            <div
              key={i}
              className="absolute text-[10px] text-gray-400 tabular-nums -translate-x-1/2"
              style={{ left: `${pct}%` }}
            >
              {show ? formatShort(t) : ""}
            </div>
          );
        })}
      </div>

      {/* Grid lines + rows */}
      <div className="relative">
        {/* Vertical grid lines */}
        {ticks.map((t, i) => (
          <div
            key={i}
            className="absolute top-0 bottom-0 w-px bg-gray-100"
            style={{ left: `${toPct(t.getTime())}%` }}
          />
        ))}

        {/* Rows */}
        <div className="relative">
          {rows.map((row, idx) => {
            const hasBoth = row.openDate && row.deadlineDate;
            const hasOne = row.openDate || row.deadlineDate;
            const theDate = row.openDate ?? row.deadlineDate!;

            return (
              <div
                key={row.id}
                className={`flex items-center h-9 ${
                  idx % 2 === 1 ? "bg-gray-50/50 rounded-lg" : ""
                }`}
              >
                {/* Label */}
                <span className="w-[140px] shrink-0 text-xs font-medium text-gray-700 truncate pr-3">
                  {row.name}
                </span>

                {/* Timeline track */}
                <div className="flex-1 relative h-full">
                  {hasBoth ? (
                    // Bar
                    <div
                      className="absolute top-1/2 -translate-y-1/2 h-[18px] rounded-full"
                      style={{
                        left: `${toPct(row.openDate!.getTime())}%`,
                        width: `${toPct(row.deadlineDate!.getTime()) - toPct(row.openDate!.getTime())}%`,
                        minWidth: 4,
                        backgroundColor: "#06b6d4",
                      }}
                    />
                  ) : hasOne ? (
                    // Point marker
                    <div
                      className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-3 h-3 rounded-full border-2 border-white"
                      style={{
                        left: `${toPct(theDate.getTime())}%`,
                        backgroundColor: "#06b6d4",
                      }}
                    />
                  ) : null}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
