"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  LabelList,
  Cell,
} from "recharts";

interface Props {
  applications: { country: string | null }[];
}

const BAR_COLORS = [
  "#6366f1", // indigo
  "#14b8a6", // teal
  "#f59e0b", // amber
  "#f43f5e", // rose
  "#10b981", // emerald
  "#8b5cf6", // purple
  "#06b6d4", // cyan
  "#f97316", // orange
];

const COUNTRY_FLAGS: Record<string, string> = {
  "usa": "🇺🇸",
  "united states": "🇺🇸",
  "united states of america": "🇺🇸",
  "uk": "🇬🇧",
  "united kingdom": "🇬🇧",
  "england": "🇬🇧",
  "canada": "🇨🇦",
  "australia": "🇦🇺",
  "germany": "🇩🇪",
  "france": "🇫🇷",
  "netherlands": "🇳🇱",
  "holland": "🇳🇱",
  "switzerland": "🇨🇭",
  "sweden": "🇸🇪",
  "denmark": "🇩🇰",
  "norway": "🇳🇴",
  "japan": "🇯🇵",
  "china": "🇨🇳",
  "singapore": "🇸🇬",
  "italy": "🇮🇹",
  "spain": "🇪🇸",
  "belgium": "🇧🇪",
  "austria": "🇦🇹",
  "finland": "🇫🇮",
  "ireland": "🇮🇪",
  "new zealand": "🇳🇿",
  "south korea": "🇰🇷",
  "india": "🇮🇳",
  "brazil": "🇧🇷",
  "south africa": "🇿🇦",
  "portugal": "🇵🇹",
  "poland": "🇵🇱",
  "czech republic": "🇨🇿",
  "greece": "🇬🇷",
  "turkey": "🇹🇷",
  "thailand": "🇹🇭",
  "malaysia": "🇲🇾",
};

function getFlag(country: string): string {
  const key = country.toLowerCase().trim();
  return COUNTRY_FLAGS[key] ?? "";
}

export default function CountryBarChart({ applications }: Props) {
  const counts: Record<string, number> = {};
  for (const app of applications) {
    if (!app.country) continue;
    counts[app.country] = (counts[app.country] ?? 0) + 1;
  }

  const data = Object.entries(counts)
    .map(([country, count]) => ({ country, count, flag: getFlag(country) }))
    .sort((a, b) => b.count - a.count);

  if (data.length === 0) {
    return (
      <div className="flex items-center justify-center py-16">
        <p className="text-sm text-gray-400">No country data yet.</p>
      </div>
    );
  }

  const maxCount = Math.max(...data.map((d) => d.count));

  return (
    <div className="pr-2">
      <ResponsiveContainer
        width="100%"
        height={Math.max(200, data.length * 52 + 20)}
      >
        <BarChart
          data={data}
          layout="vertical"
          margin={{ top: 8, right: 40, left: 0, bottom: 8 }}
          barSize={28}
        >
          <XAxis type="number" hide domain={[0, maxCount * 1.4]} />
          <YAxis
            type="category"
            dataKey="country"
            tick={({ x, y, payload }) => {
              const item = data[payload.index];
              return (
                <g transform={`translate(${x},${y})`}>
                  <text
                    x={0}
                    y={0}
                    dy={5}
                    textAnchor="end"
                    fontSize={13}
                    fill="#374151"
                    fontWeight={500}
                  >
                    {item?.flag ? `${item.flag}  ${payload.value}` : payload.value}
                  </text>
                </g>
              );
            }}
            tickLine={false}
            axisLine={false}
            width={140}
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
              padding: "8px 12px",
            }}
          />
          <Bar
            dataKey="count"
            radius={[0, 8, 8, 0]}
            maxBarSize={32}
          >
            {data.map((entry, index) => (
              <Cell
                key={entry.country}
                fill={BAR_COLORS[index % BAR_COLORS.length]}
              />
            ))}
            <LabelList
              dataKey="count"
              position="right"
              fill="#9ca3af"
              fontSize={13}
              fontWeight={600}
            />
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
