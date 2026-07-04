"use client";

import { useState } from "react";
import StatusDonut from "./StatusDonut";
import CountryBarChart from "./CountryBarChart";

interface Props {
  applications: {
    id: string;
    name: string;
    status: string;
    country: string | null;
    deadline: string | null;
    open_date: string | null;
    university: string | null;
    program: string | null;
  }[];
  watchlistItems: {
    id: string;
    name: string;
    priority: string;
    expected_deadline: string | null;
  }[];
}

const TABS = [
  { id: "status", label: "Status" },
  { id: "countries", label: "Countries" },
] as const;

type TabId = (typeof TABS)[number]["id"];

export default function DashboardCharts({ applications, watchlistItems }: Props) {
  const [activeTab, setActiveTab] = useState<TabId>("status");

  return (
    <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-6 md:p-8">
      {/* Pill tab bar */}
      <div className="flex items-center gap-1.5 mb-6 shrink-0 bg-gray-100 rounded-xl p-1.5 w-fit">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-5 py-2 text-xs font-semibold rounded-lg transition-all duration-200 ${
              activeTab === tab.id
                ? "bg-white text-indigo-700 shadow-sm ring-1 ring-gray-200"
                : "text-gray-500 hover:text-gray-700 hover:bg-gray-50"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Content area */}
      <div>
        {activeTab === "status" && <StatusDonut applications={applications} watchlistItems={watchlistItems} />}
        {activeTab === "countries" && <CountryBarChart applications={applications} />}
      </div>
    </div>
  );
}
