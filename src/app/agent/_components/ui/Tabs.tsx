"use client";

import * as React from "react";
import { cn } from "@/lib/cn";

export type TabKey = string;

export function Tabs({
  tabs,
  active,
  onChange,
  className,
}: {
  tabs: { key: TabKey; label: string }[];
  active: TabKey;
  onChange: (key: TabKey) => void;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex items-center gap-2",
        className
      )}
    >
      {tabs.map((t) => (
        <button
          key={t.key}
          type="button"
          onClick={() => onChange(t.key)}
          className={cn(
            "rounded-full border px-3 py-1.5 text-xs font-medium transition-colors",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color-mix(in_srgb,var(--z-brand)_35%,white)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--z-panel)]",
            active === t.key
              ? "border-[var(--z-border)] bg-white text-slate-900 shadow-sm"
              : "border-transparent bg-transparent text-slate-600 hover:bg-[var(--z-hover)] hover:text-slate-900"
          )}
        >
          {t.label}
        </button>
      ))}
    </div>
  );
}

