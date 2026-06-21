"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  GraduationCap,
  Users,
  Link as LinkIcon,
  Settings,
} from "lucide-react";

const navItems = [
  { href: "/", label: "Dashboard", icon: LayoutDashboard },
  { href: "/applications", label: "Applications", icon: GraduationCap },
  { href: "/supervisors", label: "Supervisors", icon: Users },
  { href: "/watched-urls", label: "Watched URLs", icon: LinkIcon },
];

export default function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="hidden md:flex fixed left-0 top-0 h-full w-[240px] flex-col bg-white border-r border-gray-200 z-40">
      <div className="flex items-center h-16 px-6">
        <span className="text-xl font-bold text-[#2d3436]">PhDTrack</span>
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
                  ? "bg-[#f0f4f0] text-[#4a7c59] border-l-4 border-[#4a7c59]"
                  : "text-gray-600 hover:bg-gray-50 border-l-4 border-transparent"
              }`}
            >
              <Icon size={20} />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>

      <div className="px-4 py-4 border-t border-gray-200">
        <Link
          href="/settings"
          className={`flex items-center gap-3 px-4 py-3 rounded-md text-sm font-medium transition-colors ${
            pathname === "/settings"
              ? "bg-[#f0f4f0] text-[#4a7c59] border-l-4 border-[#4a7c59]"
              : "text-gray-600 hover:bg-gray-50 border-l-4 border-transparent"
          }`}
        >
          <Settings size={20} />
          <span>Settings</span>
        </Link>
      </div>
    </aside>
  );
}
