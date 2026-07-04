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
import type { TooltipContentProps } from "recharts/types/component/Tooltip";

interface Props {
  applications: {
    country: string | null;
    status: string;
    university: string | null;
    program: string | null;
  }[];
}

const TOOLTIP_MAX_ITEMS = 6;

function CountryTooltip({ active, payload }: TooltipContentProps) {
  if (!active || !payload?.length) return null;

  const { country, count, apps } = payload[0].payload as {
    country: string;
    count: number;
    apps: { university: string; program: string }[];
  };
  const needsTruncation = apps.length > TOOLTIP_MAX_ITEMS;
  const visible = needsTruncation ? apps.slice(0, 5) : apps;

  return (
    <div
      style={{
        background: "#fff",
        borderRadius: "12px",
        border: "1px solid #e5e7eb",
        boxShadow: "0 4px 12px rgba(0,0,0,0.08)",
        padding: "10px 14px",
        fontSize: "13px",
        lineHeight: "1.6",
        minWidth: "220px",
        maxWidth: "380px",
      }}
    >
      <div style={{ fontWeight: 600, color: "#111827", marginBottom: 4 }}>
        {country} · {count} application{count !== 1 ? "s" : ""}
      </div>
      {visible.map((app, i) => (
        <div
          key={i}
          style={{
            color: "#4b5563",
            paddingLeft: 2,
            whiteSpace: "nowrap",
            overflow: "hidden",
            textOverflow: "ellipsis",
          }}
        >
          - {app.university} · {app.program}
        </div>
      ))}
      {needsTruncation && (
        <div style={{ color: "#9ca3af", fontSize: "12px", marginTop: 2 }}>
          ...+{apps.length - 5} more
        </div>
      )}
    </div>
  );
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
  const countriesWithNonRejected = new Set(
    applications
      .filter((app) => app.country && app.status !== "Rejected")
      .map((app) => app.country)
  );

  const counts: Record<string, number> = {};
  for (const app of applications) {
    if (!app.country) continue;
    if (!countriesWithNonRejected.has(app.country)) continue;
    counts[app.country] = (counts[app.country] ?? 0) + 1;
  }

  const data = Object.entries(counts)
    .map(([country, count]) => ({
      country,
      count,
      flag: getFlag(country),
      apps: applications
        .filter((app) => app.country === country)
        .map((app) => ({
          university: app.university ?? "Unknown University",
          program: app.program ?? "Unspecified Program",
        })),
    }))
    .sort((a, b) => b.count - a.count);

  if (data.length === 0) {
    return (
      <div className="flex items-center justify-center py-16">
        <p className="text-sm text-gray-400">No country data yet.</p>
      </div>
    );
  }

  const maxCount = Math.max(...data.map((d) => d.count));
  const ROW_HEIGHT = 38;
  const MAX_VISIBLE = 12;
  const chartHeight = data.length * ROW_HEIGHT + 20;
  const needsScroll = data.length > MAX_VISIBLE;

  return (
    <div className={needsScroll ? "pr-2 max-h-[478px] overflow-y-auto" : "pr-2"}>
      <ResponsiveContainer
        width="100%"
        height={chartHeight}
      >
        <BarChart
          data={data}
          layout="vertical"
          margin={{ top: 6, right: 36, left: 0, bottom: 6 }}
          barSize={22}
        >
          <XAxis type="number" hide domain={[0, maxCount * 1.4]} />
          <YAxis
            type="category"
            dataKey="country"
            tick={({ x, y, payload }) => {
              const item = data[payload.index];
              return (
                <foreignObject x={-165} y={Number(y) - 12} width={155} height={24} style={{ overflow: "visible" }}>
                  <div style={{
                    textAlign: "right",
                    fontSize: 13,
                    color: "#374151",
                    fontWeight: 500,
                    lineHeight: "24px",
                    whiteSpace: "nowrap",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                  }}>
                    {item?.flag ? `${item.flag}  ${payload.value}` : payload.value}
                  </div>
                </foreignObject>
              );
            }}
            tickLine={false}
            axisLine={false}
            width={160}
          />
          <Tooltip content={CountryTooltip} />
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
