"use client";

import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from "recharts";

interface Props {
  applications: { status: string }[];
}

const STATUS_COLORS: Record<string, string> = {
  Watching: "#8b5cf6",
  Applied: "#14b8a6",
  "Under Review": "#f59e0b",
  Accepted: "#10b981",
  Rejected: "#ef4444",
  Waitlisted: "#9ca3af",
};

function getColor(status: string): string {
  return STATUS_COLORS[status] ?? "#d1d5db";
}

export default function StatusDonut({ applications }: Props) {
  const counts: Record<string, number> = {};
  for (const app of applications) {
    counts[app.status] = (counts[app.status] ?? 0) + 1;
  }

  const data = Object.entries(counts)
    .map(([status, count]) => ({ name: status, count }))
    .sort((a, b) => b.count - a.count);

  if (data.length === 0) {
    return (
      <div className="bg-white rounded-2xl shadow-lg border-l-[4px] border-purple-500 p-5 md:p-6">
        <h2 className="text-xs font-semibold uppercase tracking-[0.2em] text-gray-700 mb-5">
          Application Status Breakdown
        </h2>
        <p className="text-sm text-gray-400">No applications yet.</p>
      </div>
    );
  }

  const total = data.reduce((s, d) => s + d.count, 0);

  return (
    <div className="bg-white rounded-2xl shadow-lg border-l-[4px] border-purple-500 p-5 md:p-6">
      <h2 className="text-xs font-semibold uppercase tracking-[0.2em] text-gray-700 mb-3">
        Application Status Breakdown
      </h2>

      <ResponsiveContainer width="100%" height={220}>
        <PieChart>
          <Pie
            data={data}
            dataKey="count"
            nameKey="name"
            cx="50%"
            cy="50%"
            innerRadius={55}
            outerRadius={90}
            strokeWidth={0}
          >
            {data.map((entry) => (
              <Cell key={entry.name} fill={getColor(entry.name)} />
            ))}
          </Pie>
          <Tooltip
            formatter={(value, name) => {
              const n = Number(value);
              return [`${n} (${Math.round((n / total) * 100)}%)`, name];
            }}
            contentStyle={{
              borderRadius: "12px",
              border: "1px solid #e5e7eb",
              boxShadow: "0 4px 12px rgba(0,0,0,0.08)",
              fontSize: "13px",
            }}
          />
        </PieChart>
      </ResponsiveContainer>

      {/* Legend */}
      <div className="flex flex-wrap gap-x-5 gap-y-1.5 justify-center mt-2">
        {data.map((entry) => (
          <div key={entry.name} className="flex items-center gap-2 text-sm">
            <span
              className="w-2.5 h-2.5 rounded-full shrink-0"
              style={{ backgroundColor: getColor(entry.name) }}
            />
            <span className="text-gray-700 font-medium">{entry.name}</span>
            <span className="text-gray-400 tabular-nums">{entry.count}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
