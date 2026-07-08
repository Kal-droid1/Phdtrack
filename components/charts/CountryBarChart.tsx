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
  "us": "🇺🇸",
  "united states": "🇺🇸",
  "united states of america": "🇺🇸",
  "uk": "🇬🇧",
  "gb": "🇬🇧",
  "united kingdom": "🇬🇧",
  "england": "🇬🇧",
  "canada": "🇨🇦",
  "ca": "🇨🇦",
  "australia": "🇦🇺",
  "au": "🇦🇺",
  "germany": "🇩🇪",
  "de": "🇩🇪",
  "france": "🇫🇷",
  "fr": "🇫🇷",
  "netherlands": "🇳🇱",
  "nl": "🇳🇱",
  "holland": "🇳🇱",
  "switzerland": "🇨🇭",
  "ch": "🇨🇭",
  "sweden": "🇸🇪",
  "se": "🇸🇪",
  "denmark": "🇩🇰",
  "dk": "🇩🇰",
  "norway": "🇳🇴",
  "no": "🇳🇴",
  "japan": "🇯🇵",
  "jp": "🇯🇵",
  "china": "🇨🇳",
  "cn": "🇨🇳",
  "singapore": "🇸🇬",
  "sg": "🇸🇬",
  "italy": "🇮🇹",
  "it": "🇮🇹",
  "spain": "🇪🇸",
  "es": "🇪🇸",
  "belgium": "🇧🇪",
  "be": "🇧🇪",
  "austria": "🇦🇹",
  "at": "🇦🇹",
  "finland": "🇫🇮",
  "fi": "🇫🇮",
  "ireland": "🇮🇪",
  "ie": "🇮🇪",
  "new zealand": "🇳🇿",
  "nz": "🇳🇿",
  "south korea": "🇰🇷",
  "kr": "🇰🇷",
  "india": "🇮🇳",
  "in": "🇮🇳",
  "brazil": "🇧🇷",
  "br": "🇧🇷",
  "south africa": "🇿🇦",
  "za": "🇿🇦",
  "portugal": "🇵🇹",
  "pt": "🇵🇹",
  "poland": "🇵🇱",
  "pl": "🇵🇱",
  "czech republic": "🇨🇿",
  "cz": "🇨🇿",
  "greece": "🇬🇷",
  "gr": "🇬🇷",
  "turkey": "🇹🇷",
  "tr": "🇹🇷",
  "thailand": "🇹🇭",
  "th": "🇹🇭",
  "malaysia": "🇲🇾",
  "my": "🇲🇾",
};

function isoCodeToFlag(code: string): string {
  const upper = code.toUpperCase();
  if (upper.length !== 2) return "";
  const A = "A".charCodeAt(0);
  const BASE = 0x1f1e6;
  for (let i = 0; i < 2; i++) {
    const cp = upper.charCodeAt(i);
    if (cp < A || cp > A + 25) return "";
  }
  const c0 = upper.charCodeAt(0);
  const c1 = upper.charCodeAt(1);
  return String.fromCodePoint(BASE + (c0 - A)) + String.fromCodePoint(BASE + (c1 - A));
}

function getFlag(country: string): string {
  const key = country.toLowerCase().trim();
  if (COUNTRY_FLAGS[key]) return COUNTRY_FLAGS[key];
  if (key.length === 2) return isoCodeToFlag(key);
  return "";
}

function displayCountry(raw: string): string {
  return raw.trim();
}

export default function CountryBarChart({ applications }: Props) {
  const normalized = (s: string) => s.trim().toLowerCase();

  const countriesWithNonRejected = new Set(
    applications
      .filter((app) => app.country && app.status !== "Rejected")
      .map((app) => normalized(app.country!))
  );

  const counts: Record<string, number> = {};
  const canonical: Record<string, string> = {};
  for (const app of applications) {
    if (!app.country) continue;
    if (app.status === "Rejected") continue;
    const key = normalized(app.country);
    if (!countriesWithNonRejected.has(key)) continue;
    counts[key] = (counts[key] ?? 0) + 1;
    canonical[key] = app.country;
  }

  const data = Object.entries(counts)
    .map(([key, count]) => ({
      country: displayCountry(canonical[key]),
      count,
      flag: getFlag(canonical[key]),
      apps: applications
        .filter((app) => app.country && normalized(app.country) === key && app.status !== "Rejected")
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
