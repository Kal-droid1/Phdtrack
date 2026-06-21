"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  GraduationCap,
  Users,
  Bookmark,
} from "lucide-react";

const tabs = [
  { href: "/", label: "Dashboard", icon: LayoutDashboard },
  { href: "/applications", label: "Applications", icon: GraduationCap },
  { href: "/supervisors", label: "Supervisors", icon: Users },
  { href: "/watchlist", label: "Watchlist", icon: Bookmark },
];

export default function BottomNav() {
  const pathname = usePathname();

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 h-16 bg-[#2d1f24] border-t border-[#8b3a52]/30 z-50 flex items-center justify-around px-2">
      {tabs.map((tab) => {
        const isActive = pathname === tab.href;
        const Icon = tab.icon;

        return (
          <Link
            key={tab.href}
            href={tab.href}
            className={`flex flex-col items-center justify-center gap-1 flex-1 h-full ${
              isActive ? "text-[#e8a0b0]" : "text-[#f5e6e8]"
            }`}
          >
            <Icon size={20} />
            <span className="text-[10px] font-medium leading-tight text-center">
              {tab.label}
            </span>
          </Link>
        );
      })}
    </nav>
  );
}
