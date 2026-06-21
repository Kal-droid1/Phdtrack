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
      <div className="flex items-center h-16 px-6">
        <span className="relative flex items-center gap-2 text-xl font-bold text-[#f5e6e8]">
          <span className="w-2 h-2 rounded-full bg-[#e8a0b0]" />
          PhDTrack
        </span>
      </div>

      <nav className="flex-1 px-4 py-4 space-y-1">
        {navItems.map((item) => {
          const isActive = pathname === item.href;
          const Icon = item.icon;

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 px-4 py-3 rounded-md text-sm font-medium transition-colors ${
                isActive
                  ? "bg-[#8b3a52] text-white border-l-[3px] border-[#e8a0b0]"
                  : "text-[#f5e6e8] hover:text-white hover:bg-white/10 border-l-[3px] border-transparent"
              }`}
            >
              <Icon size={20} />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>

      <div className="px-4 py-4 border-t border-[#8b3a52]/30">
        <Link
          href="/settings"
          className={`flex items-center gap-3 px-4 py-3 rounded-md text-sm font-medium transition-colors ${
            pathname === "/settings"
              ? "bg-[#8b3a52] text-white border-l-[3px] border-[#e8a0b0]"
              : "text-[#f5e6e8] hover:text-white hover:bg-white/10 border-l-[3px] border-transparent"
          }`}
        >
          <Settings size={20} />
          <span>Settings</span>
        </Link>
      </div>
    </aside>
  );
}
