"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import {
  LayoutDashboard,
  GraduationCap,
  Clock,
  Users,
  Bookmark,
} from "lucide-react";

const tabs = [
  { href: "/", label: "Dashboard", icon: LayoutDashboard },
  { href: "/applications", label: "Applications", icon: GraduationCap },
  { href: "/awaiting-result", label: "Awaiting", icon: Clock },
  { href: "/supervisors", label: "Supervisors", icon: Users },
  { href: "/watchlist", label: "Watchlist", icon: Bookmark },
];

export default function BottomNav() {
  const pathname = usePathname();
  const [awaitingCount, setAwaitingCount] = useState<number>(0);

  useEffect(() => {
    async function fetchCount() {
      const { count } = await supabase
        .from("applications")
        .select("*", { count: "exact", head: true })
        .eq("archived", false)
        .eq("status", "Awaiting Result");
      setAwaitingCount(count ?? 0);
    }
    fetchCount();
  }, [pathname]);

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 h-16 bg-white border-t border-gray-200 z-50 flex items-center justify-around px-2 shadow-[0_-4px_20px_rgba(0,0,0,0.06)]">
      {tabs.map((tab) => {
        const isActive = pathname === tab.href;
        const Icon = tab.icon;
        const label =
          tab.href === "/awaiting-result" && awaitingCount > 0
            ? `Awaiting (${awaitingCount})`
            : tab.label;

        return (
          <Link
            key={tab.href}
            href={tab.href}
            className="flex flex-col items-center justify-center gap-1 flex-1 h-full relative transition-all duration-200"
          >
            {isActive && (
              <span className="absolute -top-0.5 left-1/2 -translate-x-1/2 w-8 h-0.5 rounded-full bg-indigo-600" />
            )}
            <Icon
              size={20}
              className={isActive ? "text-indigo-600" : "text-gray-400"}
            />
            <span
              className={`text-[10px] font-semibold leading-tight text-center tracking-wide ${
                isActive ? "text-indigo-600" : "text-gray-400"
              }`}
            >
              {label}
            </span>
          </Link>
        );
      })}
    </nav>
  );
}
