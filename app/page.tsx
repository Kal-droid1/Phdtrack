"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { Application, Supervisor } from "@/types";
import { formatDate, deadlineColor, daysUntil } from "@/lib/utils";
import EmptyState from "@/components/ui/EmptyState";
import { RefreshCw } from "lucide-react";

interface DeadlineItem {
  id: string;
  name: string;
  date: string;
}

const dotColorClass: Record<"red" | "amber" | "green", string> = {
  red: "bg-red-500",
  amber: "bg-amber-500",
  green: "bg-green-500",
};

function getGreeting(): string {
  const now = new Date();
  const eatHour = new Date(
    now.toLocaleString("en-US", { timeZone: "Africa/Addis_Ababa" })
  ).getHours();
  if (eatHour < 12) return "Good morning";
  if (eatHour < 18) return "Good afternoon";
  return "Good evening";
}

export default function DashboardPage() {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalApplications: 0,
    totalSupervisors: 0,
    noReply: 0,
    deadlinesThisMonth: 0,
  });
  const [upcomingDeadlines, setUpcomingDeadlines] = useState<DeadlineItem[]>([]);
  const [followUps, setFollowUps] = useState<Supervisor[]>([]);

  const [briefLoading, setBriefLoading] = useState(false);
  const [briefText, setBriefText] = useState<string | null>(null);
  const [briefOpen, setBriefOpen] = useState(false);

  useEffect(() => {
    async function fetchDashboard() {
      setLoading(true);

      const now = new Date().toISOString();
      const thirtyDaysFromNow = new Date(
        Date.now() + 30 * 24 * 60 * 60 * 1000
      ).toISOString();

      try {
        const [
          applicationsCount,
          supervisorsCount,
          noReplyCount,
          upcomingApplications,
          deadlinesThisMonthCount,
          followUpSupervisors,
        ] = await Promise.all([
          supabase
            .from("applications")
            .select("*", { count: "exact", head: true })
            .eq("archived", false),
          supabase
            .from("supervisors")
            .select("*", { count: "exact", head: true })
            .eq("archived", false),
          supabase
            .from("supervisors")
            .select("*", { count: "exact", head: true })
            .eq("archived", false)
            .in("status", ["Sent", "No Response"]),
          supabase
            .from("applications")
            .select("id, name, deadline")
            .eq("archived", false)
            .gt("deadline", now)
            .order("deadline", { ascending: true })
            .limit(5),
          supabase
            .from("applications")
            .select("*", { count: "exact", head: true })
            .eq("archived", false)
            .gte("deadline", now)
            .lte("deadline", thirtyDaysFromNow),
          supabase
            .from("supervisors")
            .select("*")
            .eq("archived", false)
            .in("status", ["Sent", "No Response"])
            .order("date_contacted", { ascending: true, nullsFirst: false })
            .limit(5),
        ]);

        setStats({
          totalApplications: applicationsCount.count ?? 0,
          totalSupervisors: supervisorsCount.count ?? 0,
          noReply: noReplyCount.count ?? 0,
          deadlinesThisMonth: deadlinesThisMonthCount.count ?? 0,
        });

        const deadlines: DeadlineItem[] = (upcomingApplications.data ?? [])
          .filter((a) => a.deadline)
          .map((a) => ({
            id: a.id,
            name: a.name,
            date: a.deadline as string,
          }))
          .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
          .slice(0, 5);

        setUpcomingDeadlines(deadlines);
        setFollowUps((followUpSupervisors.data ?? []) as Supervisor[]);
      } finally {
        setLoading(false);
      }
    }

    fetchDashboard();
  }, []);

  function daysSince(date: string | null): number | null {
    if (!date) return null;
    const ms = new Date().getTime() - new Date(date).getTime();
    return Math.floor(ms / (1000 * 60 * 60 * 24));
  }

  async function generateBrief() {
    setBriefLoading(true);
    try {
      const [appsRes, supsRes] = await Promise.all([
        supabase.from("applications").select("*").eq("archived", false),
        supabase
          .from("supervisors")
          .select("*")
          .eq("archived", false)
          .eq("status", "Sent"),
      ]);

      const applications = (appsRes.data ?? []) as Application[];
      const supervisors = (supsRes.data ?? []) as Supervisor[];

      const now = new Date().toISOString();
      const thirtyDaysFromNow = new Date(
        Date.now() + 30 * 24 * 60 * 60 * 1000
      ).toISOString();

      const upcomingDeadlines = applications.filter(
        (a) => a.deadline && a.deadline >= now && a.deadline <= thirtyDaysFromNow
      );

      const applicationsList = applications
        .map((a) => `${a.name} (status: ${a.status}, deadline: ${a.deadline || "none"})`)
        .join("; ");

      const supervisorsList = supervisors
        .map(
          (s) =>
            `${s.name} at ${s.university} (${daysSince(s.date_contacted) ?? "unknown"} days since contacted)`
        )
        .join("; ");

      const deadlinesList = upcomingDeadlines
        .map((a) => `${a.name} (${a.deadline})`)
        .join("; ");

      const prompt = `You are a PhD application assistant. Give a short daily brief (max 150 words) for someone managing PhD applications. Be direct and practical.

Current data:
- Applications: ${applicationsList || "none"}
- Supervisors waiting for reply: ${supervisorsList || "none"}
- Upcoming deadlines in 30 days: ${deadlinesList || "none"}

Tell them: what needs urgent attention today, what can wait, and one encouragement sentence at the end. Plain text, no markdown, no bullet points.`;

      const response = await fetch("/api/groq-ai", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt }),
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Failed to generate brief");

      setBriefText(data.text);
      setBriefOpen(true);
    } catch (err) {
      setBriefText(err instanceof Error ? err.message : "Could not generate brief");
      setBriefOpen(true);
    } finally {
      setBriefLoading(false);
    }
  }

  const greeting = getGreeting();
  const today = new Date().toLocaleDateString("en-GB", {
    weekday: "long",
    day: "2-digit",
    month: "long",
    year: "numeric",
  });

  const statCards = [
    { label: "Total Applications", value: stats.totalApplications },
    { label: "Total Supervisors", value: stats.totalSupervisors },
    { label: "No Reply", value: stats.noReply },
    {
      label: "Deadlines This Month",
      value: stats.deadlinesThisMonth,
      highlight: stats.deadlinesThisMonth > 0,
    },
  ];

  return (
    <div className="p-6 md:p-8 max-w-7xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl md:text-3xl font-bold text-[#2d3436]">
          {greeting}, Kal
        </h1>
        <p className="text-sm text-gray-500 mt-1">{today}</p>
      </div>

      {loading ? (
        <div className="text-gray-500 text-sm">Loading dashboard...</div>
      ) : (
        <>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            {statCards.map((card) => (
              <div
                key={card.label}
                className="bg-white rounded-xl shadow-sm p-5"
              >
                <p
                  className={`text-xs font-medium uppercase tracking-wide ${
                    card.highlight ? "text-amber-600" : "text-gray-500"
                  }`}
                >
                  {card.label}
                </p>
                <p
                  className={`text-3xl font-bold mt-2 ${
                    card.highlight ? "text-amber-600" : "text-[#2d3436]"
                  }`}
                >
                  {card.value}
                </p>
              </div>
            ))}
          </div>

          <div className="mb-8">
            <button
              onClick={generateBrief}
              disabled={briefLoading}
              className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-[#4a7c59] rounded-md hover:bg-[#3e6b4b] transition-colors disabled:opacity-50"
            >
              {briefLoading && (
                <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              )}
              Daily Brief
            </button>

            {briefOpen && briefText && (
              <div className="mt-4 bg-white rounded-xl shadow-sm border-l-4 border-[#4a7c59] p-5 relative">
                <div className="flex items-start justify-between gap-4">
                  <p className="text-sm text-[#2d3436] whitespace-pre-line">
                    {briefText}
                  </p>
                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      onClick={generateBrief}
                      disabled={briefLoading}
                      className="p-1.5 rounded-md text-gray-400 hover:text-[#4a7c59] hover:bg-[#4a7c59]/10 transition-colors"
                      aria-label="Regenerate brief"
                    >
                      <RefreshCw size={16} />
                    </button>
                    <button
                      onClick={() => setBriefOpen(false)}
                      className="p-1.5 rounded-md text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
                      aria-label="Dismiss brief"
                    >
                      ×
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            <div className="bg-white rounded-xl shadow-sm p-6">
              <h2 className="text-lg font-semibold text-[#2d3436] mb-4">
                Upcoming Deadlines
              </h2>

              {upcomingDeadlines.length === 0 ? (
                <EmptyState message="No upcoming deadlines." />
              ) : (
                <ul className="space-y-4">
                  {upcomingDeadlines.map((item) => {
                    const days = daysUntil(item.date);
                    const color = deadlineColor(days);

                    return (
                      <li
                        key={item.id}
                        className="flex items-center justify-between"
                      >
                        <div className="flex items-center gap-3">
                          <span
                            className={`w-2.5 h-2.5 rounded-full ${dotColorClass[color]}`}
                          />
                          <div>
                            <p className="text-sm font-medium text-[#2d3436]">
                              {item.name}
                            </p>
                            <p className="text-xs text-gray-500">
                              {days < 0
                                ? `${Math.abs(days)} days ago`
                                : `${days} days left`}
                            </p>
                          </div>
                        </div>
                        <span className="text-sm text-gray-600">
                          {formatDate(item.date)}
                        </span>
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>

            <div className="bg-white rounded-xl shadow-sm p-6">
              <h2 className="text-lg font-semibold text-[#2d3436] mb-4">
                Supervisors to Follow Up
              </h2>

              {followUps.length === 0 ? (
                <EmptyState message="No supervisors need follow-up." />
              ) : (
                <ul className="space-y-4">
                  {followUps.map((supervisor) => (
                    <li
                      key={supervisor.id}
                      className="flex items-center justify-between"
                    >
                      <div>
                        <p className="text-sm font-medium text-[#2d3436]">
                          {supervisor.name}
                        </p>
                        <p className="text-xs text-gray-500">
                          {supervisor.university}
                        </p>
                      </div>
                      <span className="text-sm text-gray-600">
                        {supervisor.date_contacted
                          ? formatDate(supervisor.date_contacted)
                          : "Not contacted"}
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
