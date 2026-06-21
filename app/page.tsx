"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { Supervisor, Watchlist } from "@/types";
import { formatDate, deadlineColor, daysUntil } from "@/lib/utils";
import EmptyState from "@/components/ui/EmptyState";
import { RefreshCw, FileText, Users, Bookmark, Globe, Sparkles } from "lucide-react";

interface DeadlineItem {
  id: string;
  name: string;
  date: string;
}

const dotColorClass: Record<"red" | "amber" | "green", string> = {
  red: "bg-rose",
  amber: "bg-gold",
  green: "bg-sage",
};

const statIconColors = [
  { icon: FileText, bg: "bg-brand-light", color: "text-brand" },
  { icon: Users, bg: "bg-lavender/10", color: "text-lavender" },
  { icon: Bookmark, bg: "bg-gold/10", color: "text-gold" },
  { icon: Globe, bg: "bg-sage/10", color: "text-sage" },
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
    watchlistItems: 0,
    countriesApplied: 0,
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

      try {
        const [
          applicationsCount,
          supervisorsCount,
          watchlistCount,
          countriesRes,
          upcomingApplications,
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
            .from("watchlist")
            .select("*", { count: "exact", head: true })
            .eq("archived", false),
          supabase
            .from("applications")
            .select("country")
            .eq("archived", false)
            .not("country", "is", null),
          supabase
            .from("applications")
            .select("id, name, deadline")
            .eq("archived", false)
            .gt("deadline", now)
            .order("deadline", { ascending: true })
            .limit(5),
          supabase
            .from("supervisors")
            .select("*")
            .eq("archived", false)
            .in("status", ["Sent", "No Response"])
            .order("date_contacted", { ascending: true, nullsFirst: false })
            .limit(5),
        ]);

        const uniqueCountries = new Set(
          (countriesRes.data ?? []).map((r) => r.country).filter(Boolean)
        );

        setStats({
          totalApplications: applicationsCount.count ?? 0,
          totalSupervisors: supervisorsCount.count ?? 0,
          watchlistItems: watchlistCount.count ?? 0,
          countriesApplied: uniqueCountries.size,
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
    { label: "Watchlist Items", value: stats.watchlistItems },
    { label: "Countries Applied", value: stats.countriesApplied },
  ];

  return (
    <div className="p-6 md:p-8 max-w-7xl mx-auto">
      {/* Greeting */}
      <div className="mb-8">
        <div>
          <h1 className="text-3xl md:text-4xl font-bold text-ink tracking-tight">
            {greeting}, Kal
          </h1>
          <div className="flex items-center gap-3 mt-2">
            <span className="h-0.5 w-12 rounded-full bg-brand" />
            <p className="text-sm text-ink-light">{today}</p>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="text-ink-light text-sm animate-pulse">Loading dashboard...</div>
      ) : (
        <>
          {/* Stat Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-5 mb-8">
            {statCards.map((card, idx) => {
              const { icon: Icon, bg: iconBg, color: iconColor } = statIconColors[idx];
              return (
                <div
                  key={card.label}
                  className="bg-white rounded-2xl shadow-warm p-5 md:p-6 hover:shadow-warm-md transition-all duration-200 group"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-[11px] font-semibold uppercase tracking-widest text-ink-muted">
                        {card.label}
                      </p>
                      <p className="text-3xl md:text-4xl font-bold mt-2 text-ink tracking-tight">
                        {card.value}
                      </p>
                    </div>
                    <div className={`p-3 rounded-xl ${iconBg} group-hover:scale-105 transition-transform duration-200`}>
                      <Icon size={22} className={iconColor} />
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
              className="group flex items-center gap-2.5 px-5 py-3 text-sm font-semibold text-white bg-brand rounded-xl hover:bg-brand-hover transition-all duration-200 shadow-warm disabled:opacity-50"
            >
              {briefLoading ? (
                <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <Sparkles size={16} className="group-hover:rotate-12 transition-transform" />
              )}
              {briefLoading ? "Generating..." : "Morning Brief"}
            </button>

            {briefOpen && briefText && (
              <div className="mt-4 bg-white rounded-2xl shadow-warm border-l-[3px] border-brand p-5 md:p-6 relative">
                <div className="flex items-start justify-between gap-4">
                  <p className="text-sm text-ink leading-relaxed whitespace-pre-line">
                    {briefText}
                  </p>
                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      onClick={generateBrief}
                      disabled={briefLoading}
                      className="p-2 rounded-lg text-ink-muted hover:text-brand hover:bg-brand-light transition-all duration-200"
                      aria-label="Regenerate brief"
                    >
                      <RefreshCw size={15} />
                    </button>
                    <button
                      onClick={() => setBriefOpen(false)}
                      className="p-2 rounded-lg text-ink-muted hover:text-ink hover:bg-cream transition-all duration-200 text-lg leading-none"
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
          <div className="grid md:grid-cols-2 gap-5 md:gap-6">
            {/* Upcoming Deadlines */}
            <div className="bg-white rounded-2xl shadow-warm p-5 md:p-6">
              <div className="flex items-center gap-2.5 mb-5">
                <span className="w-1 h-5 rounded-full bg-brand" />
                <h2 className="text-base font-semibold text-ink tracking-tight">
                  Upcoming Deadlines
                </h2>
              </div>

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
                        className="flex items-center justify-between py-2 border-b border-border-light last:border-0"
                      >
                        <div className="flex items-center gap-3">
                          <span
                            className={`w-2.5 h-2.5 rounded-full ${dotColorClass[color]}`}
                          />
                          <div>
                            <p className="text-sm font-medium text-ink">
                              {item.name}
                            </p>
                            <p className="text-xs text-ink-light">
                              {days < 0
                                ? `${Math.abs(days)} days ago`
                                : `${days} days left`}
                            </p>
                          </div>
                        </div>
                        <span className="text-sm text-ink-light tabular-nums">
                          {formatDate(item.date)}
                        </span>
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>

            {/* Supervisors to Follow Up */}
            <div className="bg-white rounded-2xl shadow-warm p-5 md:p-6">
              <div className="flex items-center gap-2.5 mb-5">
                <span className="w-1 h-5 rounded-full bg-lavender" />
                <h2 className="text-base font-semibold text-ink tracking-tight">
                  Supervisors to Follow Up
                </h2>
              </div>

              {followUps.length === 0 ? (
                <EmptyState message="No supervisors need follow-up." />
              ) : (
                <ul className="space-y-4">
                  {followUps.map((supervisor) => (
                    <li
                      key={supervisor.id}
                      className="flex items-center justify-between py-2 border-b border-border-light last:border-0"
                    >
                      <div>
                        <p className="text-sm font-medium text-ink">
                          {supervisor.name}
                        </p>
                        <p className="text-xs text-ink-light">
                          {supervisor.university}
                        </p>
                      </div>
                      <span className="text-sm text-ink-light tabular-nums">
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
