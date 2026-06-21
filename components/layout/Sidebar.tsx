"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  GraduationCap,
  Users,
  Bookmark,
  Settings,
} from "lucide-react";

const navItems = [
  { href: "/", label: "Dashboard", icon: LayoutDashboard },
  { href: "/applications", label: "Applications", icon: GraduationCap },
  { href: "/supervisors", label: "Supervisors", icon: Users },
  { href: "/watchlist", label: "Watchlist", icon: Bookmark },
];

export default function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="hidden md:flex fixed left-0 top-0 h-full w-[240px] flex-col bg-sidebar z-40">
      {/* Logo */}
      <div className="flex items-center h-16 px-6 border-b border-white/5">
        <span className="relative flex items-center gap-2.5">
          <span className="relative flex h-2.5 w-2.5">
            <span className="absolute inset-0 rounded-full bg-brand animate-ping opacity-30" />
            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-brand" />
          </span>
          <span className="text-lg font-bold tracking-tight text-white/90">
            PhDTrack
          </span>
        </span>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-5 space-y-1 sidebar-scroll overflow-y-auto">
        {navItems.map((item) => {
          const isActive = pathname === item.href;
          const Icon = item.icon;

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`group flex items-center gap-3.5 px-4 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 ${
                isActive
                  ? "bg-brand/15 text-white shadow-sm"
                  : "text-white/55 hover:text-white/90 hover:bg-white/5"
              }`}
            >
              <Icon
                size={20}
                className={`transition-all duration-200 ${
                  isActive ? "text-brand" : "text-white/40 group-hover:text-white/70"
                }`}
              />
              <span>{item.label}</span>
              {isActive && (
                <span className="ml-auto w-1.5 h-1.5 rounded-full bg-brand" />
              )}
            </Link>
          );
        })}
      </nav>

      {/* Settings */}
      <div className="px-3 py-4 border-t border-white/5">
        <Link
          href="/settings"
          className={`group flex items-center gap-3.5 px-4 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 ${
            pathname === "/settings"
              ? "bg-brand/15 text-white"
              : "text-white/40 hover:text-white/70 hover:bg-white/5"
          }`}
        >
          <Settings
            size={18}
            className="transition-all duration-200 group-hover:text-white/60"
          />
          <span>Settings</span>
        </Link>
      </div>
    </aside>
  );
}
