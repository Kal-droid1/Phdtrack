"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  LabelList,
} from "recharts";

interface Props {
  applications: { country: string | null }[];
}

export default function CountryBarChart({ applications }: Props) {
  const counts: Record<string, number> = {};
  for (const app of applications) {
    if (!app.country) continue;
    counts[app.country] = (counts[app.country] ?? 0) + 1;
  }

  const data = Object.entries(counts)
    .map(([country, count]) => ({ country, count }))
    .sort((a, b) => b.count - a.count);

  if (data.length === 0) {
    return (
      <div className="bg-white rounded-2xl shadow-lg border-l-[4px] border-emerald-500 p-5 md:p-6">
        <h2 className="text-xs font-semibold uppercase tracking-[0.2em] text-gray-700 mb-5">
          Applications by Country
        </h2>
        <p className="text-sm text-gray-400">No country data yet.</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl shadow-lg border-l-[4px] border-emerald-500 p-5 md:p-6">
      <h2 className="text-xs font-semibold uppercase tracking-[0.2em] text-gray-700 mb-3">
        Applications by Country
      </h2>

      <ResponsiveContainer width="100%" height={Math.max(180, data.length * 44)}>
        <BarChart
          data={data}
          layout="vertical"
          margin={{ top: 4, right: 36, left: 0, bottom: 4 }}
          barSize={22}
        >
          <XAxis type="number" hide />
          <YAxis
            type="category"
            dataKey="country"
            tick={{ fontSize: 12, fill: "#374151", fontWeight: 500 }}
            tickLine={false}
            axisLine={false}
            width={120}
          />
          <Tooltip
            formatter={(value) => {
              const n = Number(value);
              return [`${n} application${n === 1 ? "" : "s"}`, "Count"];
            }}
            contentStyle={{
              borderRadius: "12px",
              border: "1px solid #e5e7eb",
              boxShadow: "0 4px 12px rgba(0,0,0,0.08)",
              fontSize: "13px",
            }}
          />
          <Bar dataKey="count" fill="#8b5cf6" radius={[0, 6, 6, 0]}>
            <LabelList
              dataKey="count"
              position="right"
              fill="#9ca3af"
              fontSize={12}
              fontWeight={600}
            />
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
