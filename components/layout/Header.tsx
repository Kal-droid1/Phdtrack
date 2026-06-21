"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { Bell } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { Application, Watchlist } from "@/types";
import { daysUntil, deadlineColor, formatDate } from "@/lib/utils";

const dotColorClass: Record<"red" | "amber" | "green", string> = {
  red: "bg-red-500",
  amber: "bg-amber-500",
  green: "bg-green-500",
};

interface ReminderItem {
  id: string;
  label: string;
  date: string;
  days: number;
  color: "red" | "amber" | "green";
  kind: "Deadline" | "Opening soon";
  href: string;
}

export default function Header() {
  const [applications, setApplications] = useState<Application[]>([]);
  const [watchlistItems, setWatchlistItems] = useState<Watchlist[]>([]);
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  async function fetchReminders() {
    const now = new Date().toISOString();
    const thirtyDaysFromNow = new Date(
      Date.now() + 30 * 24 * 60 * 60 * 1000
    ).toISOString();

    const [appRes, watchRes] = await Promise.all([
      supabase
        .from("applications")
        .select("*")
        .eq("reminder", true)
        .eq("archived", false)
        .gt("deadline", now)
        .order("deadline", { ascending: true }),
      supabase
        .from("watchlist")
        .select("*")
        .eq("reminder", true)
        .eq("archived", false)
        .not("expected_open_date", "is", null)
        .lte("expected_open_date", thirtyDaysFromNow)
        .order("expected_open_date", { ascending: true }),
    ]);

    if (!appRes.error && appRes.data) {
      setApplications(appRes.data as Application[]);
    }
    if (!watchRes.error && watchRes.data) {
      setWatchlistItems(watchRes.data as Watchlist[]);
    }
  }

  useEffect(() => {
    fetchReminders();
  }, []);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (
        containerRef.current &&
        !containerRef.current.contains(e.target as Node)
      ) {
        setOpen(false);
      }
    }

    if (open) {
      document.addEventListener("mousedown", handleClickOutside);
      return () => document.removeEventListener("mousedown", handleClickOutside);
    }
  }, [open]);

  const now = new Date();
  const thirtyDaysFromNow = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

  const reminders: ReminderItem[] = [
    ...applications
      .filter((a) => a.deadline && new Date(a.deadline) > now)
      .map((a) => {
        const days = daysUntil(a.deadline!);
        const color = deadlineColor(days);
        return {
          id: a.id,
          label: a.name,
          date: a.deadline!,
          days,
          color,
          kind: "Deadline" as const,
          href: "/applications",
        };
      }),
    ...watchlistItems
      .filter(
        (w) =>
          w.expected_open_date &&
          new Date(w.expected_open_date) >= now &&
          new Date(w.expected_open_date) <= thirtyDaysFromNow
      )
      .map((w) => {
        const days = daysUntil(w.expected_open_date!);
        return {
          id: w.id,
          label: w.name,
          date: w.expected_open_date!,
          days,
          color: "amber" as const,
          kind: "Opening soon" as const,
          href: "/watchlist",
        };
      }),
  ].sort((a, b) => a.days - b.days);

  const upcomingCount = reminders.length;

  return (
    <header className="sticky top-0 z-30 bg-[#2d1f24] border-b border-[#8b3a52]/30 px-6 py-3">
      <div className="flex items-center justify-end">
        <div className="relative" ref={containerRef}>
          <button
            onClick={() => setOpen(!open)}
            className="relative p-2 rounded-md text-[#f5e6e8] hover:bg-white/10 transition-colors"
            aria-label="Open reminders"
          >
            <Bell size={20} />
            {upcomingCount > 0 && (
              <span className="absolute top-1 right-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-[#8b3a52] text-[10px] font-medium text-white px-1">
                {upcomingCount}
              </span>
            )}
          </button>

          {open && (
            <div className="absolute right-0 mt-2 w-80 bg-white rounded-xl shadow-lg border border-[#e8c5cc] py-4 z-50">
              <p className="px-4 text-sm font-semibold text-[#1a1a1a]">
                Upcoming Reminders
              </p>

              <div className="mt-3 max-h-80 overflow-y-auto">
                {reminders.length === 0 ? (
                  <p className="px-4 text-sm text-[#6b4f55]">
                    No upcoming reminders
                  </p>
                ) : (
                  <ul className="divide-y divide-[#e8c5cc]/50">
                    {reminders.map((item) => (
                      <li
                        key={`${item.kind}-${item.id}`}
                        className="px-4 py-3 flex items-center gap-3"
                      >
                        <span
                          className={`w-2 h-2 rounded-full shrink-0 ${
                            dotColorClass[item.color]
                          }`}
                        />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-[#1a1a1a] truncate">
                            {item.label}
                          </p>
                          <p className="text-xs text-[#6b4f55]">
                            {formatDate(item.date)} &bull;{" "}
                            <span
                              className={
                                item.kind === "Opening soon"
                                  ? "text-secondary font-medium"
                                  : ""
                              }
                            >
                              {item.kind}
                            </span>{" "}
                            &bull;{" "}
                            {item.days < 0
                              ? `${Math.abs(item.days)} days ago`
                              : `${item.days} days left`}
                          </p>
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
              </div>

              <div className="mt-3 px-4 pt-3 border-t border-[#e8c5cc]/50 flex gap-3">
                <Link
                  href="/applications"
                  onClick={() => setOpen(false)}
                  className="text-sm font-medium text-[#8b3a52] hover:text-[#a84a66] transition-colors"
                >
                  Applications
                </Link>
                <Link
                  href="/watchlist"
                  onClick={() => setOpen(false)}
                  className="text-sm font-medium text-[#8b3a52] hover:text-[#a84a66] transition-colors"
                >
                  Watchlist
                </Link>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
