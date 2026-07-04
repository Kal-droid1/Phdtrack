"use client";

import { useMemo } from "react";
import { PieChart, Pie, Cell, ResponsiveContainer } from "recharts";
import { daysUntil } from "@/lib/utils";

interface Props {
  applications: { status: string }[];
  watchlistItems: {
    id: string;
    name: string;
    priority: string;
    funding_body: string | null;
    expected_deadline: string | null;
  }[];
}

const STATUS_COLORS: Record<string, string> = {
  Watching: "#8b5cf6",
  Applied: "#14b8a6",
  "Awaiting Result": "#0ea5e9",
  "Under Review": "#f59e0b",
  Accepted: "#10b981",
  Rejected: "#ef4444",
  Waitlisted: "#9ca3af",
};

function getColor(status: string): string {
  return STATUS_COLORS[status] ?? "#d1d5db";
}

export default function StatusDonut({ applications, watchlistItems }: Props) {
  const counts: Record<string, number> = {};
  for (const app of applications) {
    counts[app.status] = (counts[app.status] ?? 0) + 1;
  }

  const data = Object.entries(counts)
    .map(([status, count]) => ({ name: status, count }))
    .sort((a, b) => b.count - a.count);

  const stats = useMemo(() => {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);

    const futureItems = watchlistItems
      .filter((w) => w.expected_deadline && new Date(w.expected_deadline) > now)
      .sort((a, b) => new Date(a.expected_deadline!).getTime() - new Date(b.expected_deadline!).getTime());

    const nextDeadline = futureItems[0] ?? null;
    const nextDays = nextDeadline ? daysUntil(nextDeadline.expected_deadline!) : null;
    const nextDeadlineLabel = nextDeadline
      ? nextDeadline.funding_body || nextDeadline.name
      : null;

    const urgentItems = watchlistItems.filter((w) => w.priority === "urgent");

    const thisMonthItems = watchlistItems.filter((w) => {
      if (!w.expected_deadline) return false;
      const d = new Date(w.expected_deadline);
      return d >= startOfMonth && d <= endOfMonth;
    });

    return {
      nextDeadline,
      nextDeadlineLabel,
      nextDays,
      urgentItems,
      thisMonthItems,
    };
  }, [watchlistItems]);

  if (data.length === 0) {
    return (
      <div className="flex items-center justify-center py-16">
        <p className="text-sm text-gray-400">No applications yet.</p>
      </div>
    );
  }

  const total = data.reduce((s, d) => s + d.count, 0);

  return (
    <div className="flex items-center gap-8 md:gap-10">
      {/* Donut */}
      <div className="relative shrink-0" style={{ width: 320, height: 320 }}>
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              dataKey="count"
              nameKey="name"
              cx="50%"
              cy="50%"
              innerRadius={100}
              outerRadius={150}
              strokeWidth={2}
              stroke="#fff"
              cornerRadius={4}
              paddingAngle={2}
            >
              {data.map((entry) => (
                <Cell key={entry.name} fill={getColor(entry.name)} />
              ))}
            </Pie>
          </PieChart>
        </ResponsiveContainer>
        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
          <span className="text-4xl font-black text-[#1e1b4b] font-[Syne,system-ui] leading-none">
            {total}
          </span>
          <span className="text-xs font-semibold text-gray-400 tracking-[0.1em] uppercase mt-1">
            total
          </span>
        </div>
      </div>

      {/* Legend */}
      <div className="flex-1 flex flex-col gap-3">
        {data.map((entry) => {
          const pct = Math.round((entry.count / total) * 100);
          return (
            <div key={entry.name} className="flex items-center gap-3 group cursor-default">
              <span
                className="w-3 h-3 rounded-full shrink-0 ring-2 ring-white shadow-sm transition-transform duration-200 group-hover:scale-125"
                style={{ backgroundColor: getColor(entry.name) }}
              />
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-sm font-medium text-gray-800">{entry.name}</span>
                  <span className="text-sm font-semibold text-gray-900 tabular-nums">
                    {entry.count}
                  </span>
                </div>
                <div className="w-full max-w-[180px] h-1 bg-gray-100 rounded-full mt-1 overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-500"
                    style={{
                      width: `${pct}%`,
                      backgroundColor: getColor(entry.name),
                    }}
                  />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Divider */}
      <div className="self-stretch border-l border-gray-100" />

      {/* Stats panel */}
      <div className="flex-1 flex flex-col justify-center gap-5">
        {/* Next Deadline */}
        <div className="group relative">
          <p className="text-[10px] font-semibold text-gray-400 tracking-[0.15em] uppercase mb-1.5 pb-1.5 border-b border-gray-100">
            Next Deadline
          </p>
          {stats.nextDeadline ? (
            <>
              <p className="text-sm font-semibold text-gray-900 truncate max-w-[180px]">
                {stats.nextDeadlineLabel}
              </p>
              <p className="text-xs text-gray-500 mt-0.5">
                {stats.nextDays} day{stats.nextDays !== 1 ? "s" : ""} remaining
              </p>
              <div className="absolute left-0 top-full mt-1 z-50 w-max max-w-[220px] rounded-lg bg-gray-900 text-white text-xs px-3 py-2 shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-150 pointer-events-none">
                {stats.nextDeadline.name}
              </div>
            </>
          ) : (
            <p className="text-xs text-gray-400">No upcoming deadlines</p>
          )}
        </div>

        {/* Urgent Items */}
        <div className="group relative">
          <p className="text-[10px] font-semibold text-gray-400 tracking-[0.15em] uppercase mb-1.5 pb-1.5 border-b border-gray-100">
            Urgent Items
          </p>
          <span className="text-lg font-bold text-[#1e1b4b] tabular-nums">{stats.urgentItems.length}</span>
          <p className="text-xs text-gray-500">marked Urgent</p>
          {stats.urgentItems.length > 0 && (
            <div className="absolute left-0 top-full mt-1 z-50 w-max max-w-[240px] rounded-lg bg-gray-900 text-white text-xs px-3 py-2 shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-150 pointer-events-none">
              <ul className="space-y-1">
                {stats.urgentItems.map((item) => (
                  <li key={item.id} className="truncate">
                    {item.funding_body ? `${item.name} — ${item.funding_body}` : item.name}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>

        {/* This Month */}
        <div className="group relative">
          <p className="text-[10px] font-semibold text-gray-400 tracking-[0.15em] uppercase mb-1.5 pb-1.5 border-b border-gray-100">
            This Month
          </p>
          <span className="text-lg font-bold text-[#1e1b4b] tabular-nums">{stats.thisMonthItems.length}</span>
          <p className="text-xs text-gray-500">
            deadline{stats.thisMonthItems.length !== 1 ? "s" : ""} this month
          </p>
          {stats.thisMonthItems.length > 0 && (
            <div className="absolute left-0 top-full mt-1 z-50 w-max max-w-[240px] rounded-lg bg-gray-900 text-white text-xs px-3 py-2 shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-150 pointer-events-none">
              <ul className="space-y-1">
                {stats.thisMonthItems.map((item) => (
                  <li key={item.id} className="truncate">
                    {item.funding_body ? `${item.name} — ${item.funding_body}` : item.name}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
