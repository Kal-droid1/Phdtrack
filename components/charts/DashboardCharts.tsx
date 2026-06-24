"use client";

import { useState } from "react";
import StatusDonut from "./StatusDonut";
import CountryBarChart from "./CountryBarChart";
import TimelineChart from "./TimelineChart";

interface Props {
  applications: { status: string; country: string | null }[];
  watchlistItems: { name: string; expected_open_date: string | null; expected_deadline: string | null }[];
}

const TABS = [
  { id: "status", label: "Status" },
  { id: "countries", label: "Countries" },
  { id: "timeline", label: "Timeline" },
] as const;

type TabId = (typeof TABS)[number]["id"];

export default function DashboardCharts({ applications, watchlistItems }: Props) {
  const [activeTab, setActiveTab] = useState<TabId>("status");

  return (
    <div className="bg-white rounded-2xl shadow-lg border-l-[4px] border-indigo-500 p-5 md:p-6 h-[380px] flex flex-col">
      {/* Tab bar */}
      <div className="flex items-center gap-1 mb-4 border-b border-gray-100 pb-3 shrink-0">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-4 py-1.5 text-xs font-semibold rounded-lg transition-all duration-200 ${
              activeTab === tab.id
                ? "bg-indigo-100 text-indigo-700 shadow-sm"
                : "text-gray-400 hover:text-gray-600 hover:bg-gray-50"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Content area */}
      <div className="flex-1 min-h-0">
        {activeTab === "status" && <StatusDonut applications={applications} embedded />}
        {activeTab === "countries" && <CountryBarChart applications={applications} embedded />}
        {activeTab === "timeline" && <TimelineChart items={watchlistItems} />}
      </div>
    </div>
  );
}
