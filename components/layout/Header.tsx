"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { Bell } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { Application } from "@/types";
import { daysUntil, deadlineColor, formatDate } from "@/lib/utils";

const dotColorClass: Record<"red" | "amber" | "green", string> = {
  red: "bg-red-500",
  amber: "bg-amber-500",
  green: "bg-green-500",
};

export default function Header() {
  const [applications, setApplications] = useState<Application[]>([]);
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  async function fetchReminders() {
    const now = new Date().toISOString();

    const { data, error } = await supabase
      .from("applications")
      .select("*")
      .eq("reminder", true)
      .eq("archived", false)
      .gt("deadline", now)
      .order("deadline", { ascending: true });

    if (!error && data) {
      setApplications(data as Application[]);
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

  const upcomingCount = applications.filter((a) => {
    if (!a.deadline) return false;
    const d = new Date(a.deadline);
    return d > now && d <= thirtyDaysFromNow;
  }).length;

  return (
    <header className="sticky top-0 z-30 bg-white border-b border-gray-200 px-6 py-3">
      <div className="flex items-center justify-end">
        <div className="relative" ref={containerRef}>
          <button
            onClick={() => setOpen(!open)}
            className="relative p-2 rounded-md text-gray-600 hover:bg-gray-100 transition-colors"
            aria-label="Open reminders"
          >
            <Bell size={20} />
            {upcomingCount > 0 && (
              <span className="absolute top-1 right-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-red-500 text-[10px] font-medium text-white px-1">
                {upcomingCount}
              </span>
            )}
          </button>

          {open && (
            <div className="absolute right-0 mt-2 w-80 bg-white rounded-xl shadow-lg border border-gray-200 py-4 z-50">
              <p className="px-4 text-sm font-semibold text-[#2d3436]">
                Upcoming Reminders
              </p>

              <div className="mt-3 max-h-80 overflow-y-auto">
                {applications.length === 0 ? (
                  <p className="px-4 text-sm text-gray-500">No upcoming reminders</p>
                ) : (
                  <ul className="divide-y divide-gray-100">
                    {applications.map((application) => {
                      const days = application.deadline
                        ? daysUntil(application.deadline)
                        : 0;
                      const color = application.deadline
                        ? deadlineColor(days)
                        : "green";

                      return (
                        <li
                          key={application.id}
                          className="px-4 py-3 flex items-center gap-3"
                        >
                          <span
                            className={`w-2 h-2 rounded-full shrink-0 ${
                              dotColorClass[color]
                            }`}
                          />
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-[#2d3436] truncate">
                              {application.name}
                            </p>
                            <p className="text-xs text-gray-500">
                              {application.deadline
                                ? `${formatDate(application.deadline)} • ${
                                    days < 0
                                      ? `${Math.abs(days)} days ago`
                                      : `${days} days left`
                                  }`
                                : "No deadline"}
                            </p>
                          </div>
                        </li>
                      );
                    })}
                  </ul>
                )}
              </div>

              <div className="mt-3 px-4 pt-3 border-t border-gray-200">
                <Link
                  href="/applications"
                  onClick={() => setOpen(false)}
                  className="text-sm font-medium text-[#4a7c59] hover:text-[#3e6b4b] transition-colors"
                >
                  View all applications
                </Link>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
