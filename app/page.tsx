"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { Supervisor, Watchlist } from "@/types";
import { formatDate, deadlineColor, daysUntil } from "@/lib/utils";
import EmptyState from "@/components/ui/EmptyState";
import { RefreshCw, FileText, Users, Clock, CalendarClock } from "lucide-react";

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

const statIconColors = [
  { icon: FileText, bg: "bg-accent/20", color: "text-accent" },
  { icon: Users, bg: "bg-blue-400/20", color: "text-blue-400" },
  { icon: Clock, bg: "bg-amber-400/20", color: "text-secondary" },
  { icon: CalendarClock, bg: "bg-red-400/20", color: "text-red-400" },
];

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
      const [supsRes, watchRes] = await Promise.all([
        supabase
          .from("supervisors")
          .select("*")
          .eq("archived", false)
          .eq("status", "Sent"),
        supabase
          .from("watchlist")
          .select("*")
          .eq("archived", false)
          .not("expected_open_date", "is", null)
          .gt("expected_open_date", new Date().toISOString())
          .lte(
            "expected_open_date",
            new Date(Date.now() + 60 * 24 * 60 * 60 * 1000).toISOString()
          )
          .order("expected_open_date", { ascending: true }),
      ]);

      const supervisors = (supsRes.data ?? []) as Supervisor[];
      const watchlistItems = (watchRes.data ?? []) as Watchlist[];

      const supervisorsList = supervisors
        .map(
          (s) =>
            `${s.name}, ${s.university} (${daysSince(s.date_contacted) ?? "unknown"} days since contacted)`
        )
        .join("; ");

      const watchlistList = watchlistItems
        .map((w) => `${w.name} (expected: ${w.expected_open_date})`)
        .join("; ");

      const prompt = `You are a PhD application assistant. The user has ALREADY SUBMITTED all their applications and is now waiting for results. Give a short daily brief (max 120 words) focused on:
1. Which supervisors have not replied and need a follow-up (mention names and how many days since contacted)
2. Any upcoming watchlist items opening soon
3. General encouragement for someone in the waiting phase

Do NOT tell them to submit or prepare applications — they are already done. Plain text only, no markdown, no bullet points.

Supervisors with no reply (Sent status): ${supervisorsList || "none"}
Upcoming watchlist items: ${watchlistList || "none"}`;

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
    { label: "Supervisors", value: stats.totalSupervisors },
    { label: "No Reply", value: stats.noReply },
    {
      label: "Deadlines This Month",
      value: stats.deadlinesThisMonth,
      highlight: stats.deadlinesThisMonth > 0,
    },
  ];

  return (
    <div className="p-6 md:p-8 max-w-7xl mx-auto">
      {/* Greeting */}
      <div className="mb-8">
        <div className="inline-block">
          <h1 className="text-2xl md:text-3xl font-bold text-white">
            {greeting}, Kal
          </h1>
          <div className="h-0.5 w-16 bg-accent rounded-full mt-1" />
        </div>
        <p className="text-sm text-textMuted mt-2">{today}</p>
      </div>

      {loading ? (
        <div className="text-textMuted text-sm">Loading dashboard...</div>
      ) : (
        <>
          {/* Stat Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            {statCards.map((card, idx) => {
              const { icon: Icon, bg: iconBg, color: iconColor } = statIconColors[idx];
              return (
                <div
                  key={card.label}
                  className="bg-card border border-cardBorder rounded-xl p-5 hover:border-accent transition-colors duration-200"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <p
                        className={`text-xs font-medium uppercase tracking-wide ${
                          card.highlight ? "text-secondary" : "text-textMuted"
                        }`}
                      >
                        {card.label}
                      </p>
                      <p
                        className={`text-3xl font-bold mt-2 ${
                          card.highlight ? "text-secondary" : "text-white"
                        }`}
                      >
                        {card.value}
                      </p>
                    </div>
                    <div className={`p-2 rounded-lg ${iconBg}`}>
                      <Icon size={20} className={iconColor} />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Daily Brief */}
          <div className="mb-8">
            <button
              onClick={generateBrief}
              disabled={briefLoading}
              className="flex items-center gap-2 px-5 py-2.5 text-sm font-semibold text-black bg-accent rounded-lg hover:bg-green-300 transition-colors disabled:opacity-50"
            >
              {briefLoading && (
                <span className="w-4 h-4 border-2 border-black border-t-transparent rounded-full animate-spin" />
              )}
              Daily Brief
            </button>

            {briefOpen && briefText && (
              <div className="mt-4 bg-card border border-cardBorder rounded-xl border-l-4 border-l-accent p-5 relative">
                <div className="flex items-start justify-between gap-4">
                  <p className="text-sm text-gray-200 whitespace-pre-line leading-relaxed">
                    {briefText}
                  </p>
                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      onClick={generateBrief}
                      disabled={briefLoading}
                      className="p-1.5 rounded-md text-textMuted hover:text-accent hover:bg-accent/10 transition-colors"
                      aria-label="Regenerate brief"
                    >
                      <RefreshCw size={16} />
                    </button>
                    <button
                      onClick={() => setBriefOpen(false)}
                      className="p-1.5 rounded-md text-textMuted hover:text-white hover:bg-white/10 transition-colors"
                      aria-label="Dismiss brief"
                    >
                      ×
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Two Panels */}
          <div className="grid md:grid-cols-2 gap-6">
            {/* Upcoming Deadlines */}
            <div className="bg-card border border-cardBorder rounded-xl p-6">
              <h2 className="text-lg font-semibold text-white mb-4">
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
                            <p className="text-sm font-medium text-white">
                              {item.name}
                            </p>
                            <p className="text-xs text-textMuted">
                              {days < 0
                                ? `${Math.abs(days)} days ago`
                                : `${days} days left`}
                            </p>
                          </div>
                        </div>
                        <span className="text-sm text-textMuted">
                          {formatDate(item.date)}
                        </span>
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>

            {/* Supervisors to Follow Up */}
            <div className="bg-card border border-cardBorder rounded-xl p-6">
              <h2 className="text-lg font-semibold text-white mb-4">
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
                        <p className="text-sm font-medium text-white">
                          {supervisor.name}
                        </p>
                        <p className="text-xs text-textMuted">
                          {supervisor.university}
                        </p>
                      </div>
                      <span className="text-sm text-textMuted">
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
