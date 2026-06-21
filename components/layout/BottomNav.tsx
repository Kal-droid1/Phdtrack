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
    <nav
      className="md:hidden fixed bottom-0 left-0 right-0 h-16 z-50 flex items-center justify-around px-2"
      style={{
        background: "rgba(10, 10, 15, 0.95)",
        backdropFilter: "blur(20px)",
        borderTop: "1px solid rgba(255,255,255,0.08)",
      }}
    >
      {tabs.map((tab) => {
        const isActive = pathname === tab.href;
        const Icon = tab.icon;

        return (
          <Link
            key={tab.href}
            href={tab.href}
            className="flex flex-col items-center justify-center gap-1 flex-1 h-full relative transition-all duration-200"
          >
            {isActive && (
              <span className="absolute -top-0.5 left-1/2 -translate-x-1/2 w-8 h-0.5 rounded-full"
                style={{ background: "linear-gradient(90deg, #8b5cf6, #14b8a6)" }}
              />
            )}
            <Icon
              size={20}
              className={isActive ? "gradient-text" : "text-white/40"}
            />
            <span
              className={`text-[10px] font-semibold leading-tight text-center tracking-wide ${
                isActive ? "gradient-text" : "text-white/40"
              }`}
            >
              {tab.label}
            </span>
          </Link>
        );
      })}
    </nav>
  );
}
