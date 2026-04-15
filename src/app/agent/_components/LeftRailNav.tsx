 "use client";

import {
  Bell,
  BarChart3,
  Headphones,
  Home,
  LayoutGrid,
  Search,
  Settings,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/cn";

const railItems = [
  { icon: Home, label: "Home", href: "/agent/home/tickets" },
  { icon: Headphones, label: "Tickets", href: "/agent/home/tickets" },
  { icon: Search, label: "Search" },
  { icon: BarChart3, label: "Analytics", href: "/agent/analytics" },
  { icon: LayoutGrid, label: "Apps" },
  { icon: Bell, label: "Notifications" },
  { icon: Settings, label: "Settings" },
];

export function LeftRailNav() {
  const pathname = usePathname();
  return (
    <div className="flex h-full flex-col items-center gap-3 py-3">
      <div className="mb-1 flex h-9 w-9 items-center justify-center rounded-lg bg-white/10 text-sm font-semibold tracking-tight">
        Z
      </div>
      <div className="flex flex-col items-center gap-1.5">
        {railItems.map((it) => (
          it.href ? (
            <Link
              key={it.label}
              href={it.href}
              className={cn(
                "group flex h-10 w-10 items-center justify-center rounded-lg transition-colors",
                pathname === it.href
                  ? "bg-white/15 text-white"
                  : "text-white/80 hover:bg-white/10 hover:text-white"
              )}
              aria-label={it.label}
              title={it.label}
            >
              <it.icon className="h-5 w-5" />
            </Link>
          ) : (
            <button
              key={it.label}
              type="button"
              className="group flex h-10 w-10 items-center justify-center rounded-lg text-white/80 transition-colors hover:bg-white/10 hover:text-white"
              aria-label={it.label}
              title={it.label}
            >
              <it.icon className="h-5 w-5" />
            </button>
          )
        ))}
      </div>
      <div className="mt-auto pb-3">
        <div className="flex h-9 w-9 items-center justify-center rounded-full bg-white/10 text-xs font-semibold">
          AS
        </div>
      </div>
    </div>
  );
}

