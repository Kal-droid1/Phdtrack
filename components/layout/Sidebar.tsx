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
    <aside className="hidden md:flex fixed left-0 top-0 h-full w-[240px] flex-col z-40"
      style={{
        background: "rgba(255,255,255,0.03)",
        backdropFilter: "blur(20px)",
        WebkitBackdropFilter: "blur(20px)",
        borderRight: "1px solid rgba(255,255,255,0.08)",
      }}
    >
      {/* Logo */}
      <div className="flex items-center h-16 px-6 border-b" style={{ borderColor: "rgba(255,255,255,0.06)" }}>
        <span className="font-syne text-xl font-extrabold">
          <span className="gradient-text">PhDTrack</span>
        </span>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-6 space-y-1.5 sidebar-scroll overflow-y-auto">
        {navItems.map((item) => {
          const isActive = pathname === item.href;
          const Icon = item.icon;

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`group flex items-center gap-3.5 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-300 relative ${
                isActive
                  ? "text-white"
                  : "text-white/40 hover:text-white/70 hover:bg-white/5"
              }`}
              style={
                isActive
                  ? {
                      background: "linear-gradient(135deg, rgba(139,92,246,0.2), rgba(20,184,166,0.2))",
                      boxShadow: "0 0 20px rgba(139,92,246,0.15)",
                    }
                  : {}
              }
            >
              <Icon
                size={20}
                className={`transition-all duration-300 ${
                  isActive ? "text-glow-purple" : "text-white/30 group-hover:text-white/60"
                }`}
              />
              <span>{item.label}</span>
              {isActive && (
                <span className="ml-auto w-2 h-2 rounded-full bg-glow-purple shadow-glow-purple" />
              )}
            </Link>
          );
        })}
      </nav>

      {/* Settings */}
      <div className="px-3 py-4 border-t" style={{ borderColor: "rgba(255,255,255,0.06)" }}>
        <Link
          href="/settings"
          className={`group flex items-center gap-3.5 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200 ${
            pathname === "/settings"
              ? "text-white bg-white/10"
              : "text-white/30 hover:text-white/60 hover:bg-white/5"
          }`}
        >
          <Settings size={18} className="transition-all duration-200 group-hover:text-white/60" />
          <span>Settings</span>
        </Link>
      </div>
    </aside>
  );
}
