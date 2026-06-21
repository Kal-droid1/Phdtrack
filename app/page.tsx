"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { Supervisor } from "@/types";
import { formatDate, deadlineColor, daysUntil } from "@/lib/utils";
import EmptyState from "@/components/ui/EmptyState";

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
