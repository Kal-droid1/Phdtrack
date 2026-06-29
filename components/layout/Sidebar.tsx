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
  Settings,
} from "lucide-react";

const navItems = [
  { href: "/", label: "Dashboard", icon: LayoutDashboard },
  { href: "/applications", label: "Applications", icon: GraduationCap },
  { href: "/awaiting-result", label: "Awaiting Result", icon: Clock },
  { href: "/supervisors", label: "Supervisors", icon: Users },
  { href: "/watchlist", label: "Watchlist", icon: Bookmark },
];

export default function Sidebar() {
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
    <aside
      className="hidden md:flex fixed left-0 top-0 h-full w-[240px] flex-col z-40"
      style={{
        background: "linear-gradient(180deg, #6366f1 0%, #8b5cf6 50%, #a855f7 100%)",
      }}
    >
      {/* Logo */}
      <div className="flex items-center h-16 px-6">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-xl bg-white/20 flex items-center justify-center">
            <span className="text-white font-bold text-sm">P</span>
          </div>
          <span className="font-syne text-xl font-extrabold text-white tracking-tight">
            PhDTrack
          </span>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-6 space-y-1 sidebar-scroll overflow-y-auto">
        {navItems.map((item) => {
          const isActive = pathname === item.href;
          const Icon = item.icon;
          const label =
            item.href === "/awaiting-result" && awaitingCount > 0
              ? `Awaiting Result (${awaitingCount})`
              : item.label;

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3.5 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200 ${
                isActive
                  ? "bg-white text-indigo-600 shadow-md"
                  : "text-white/80 hover:bg-white/20"
              }`}
            >
              <Icon
                size={20}
                className={`transition-all duration-200 ${
                  isActive ? "text-indigo-600" : "text-white/70"
                }`}
              />
              <span>{label}</span>
            </Link>
          );
        })}
      </nav>

      {/* Settings */}
      <div className="px-3 py-4">
        <Link
          href="/settings"
          className={`flex items-center gap-3.5 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200 ${
            pathname === "/settings"
              ? "bg-white text-indigo-600 shadow-md"
              : "text-white/70 hover:bg-white/20"
          }`}
        >
          <Settings size={18} />
          <span>Settings</span>
        </Link>
      </div>
    </aside>
  );
}
