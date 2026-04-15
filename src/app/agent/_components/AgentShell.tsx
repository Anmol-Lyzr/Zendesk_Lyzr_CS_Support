import * as React from "react";
import { LeftRailNav } from "@/app/agent/_components/LeftRailNav";

export function AgentShell({
  topTabs,
  leftRail,
  leftPanel,
  centerHeader,
  center,
  rightPanel,
}: {
  topTabs?: React.ReactNode;
  leftRail?: React.ReactNode;
  leftPanel: React.ReactNode;
  centerHeader?: React.ReactNode;
  center: React.ReactNode;
  rightPanel: React.ReactNode;
}) {
  return (
    <div className="h-screen overflow-hidden bg-[var(--z-canvas)]">
      <div className="flex h-full min-h-0">
        <aside className="w-[64px] shrink-0 bg-[linear-gradient(180deg,var(--z-rail),var(--z-rail-2))] text-white">
          <LeftRailNav />
          {leftRail}
        </aside>

        <main className="flex min-h-0 min-w-0 flex-1 flex-col">
          {topTabs ? (
            <div className="flex min-w-0 items-center justify-between gap-4 border-b border-[var(--z-border)] bg-[var(--z-panel)] px-4 py-2.5">
              {topTabs}
              <div className="flex items-center gap-2 text-xs text-slate-500">
                <span className="rounded-full bg-slate-100 px-2 py-1">
                  Conversations
                </span>
                <span className="rounded-full bg-slate-100 px-2 py-1">
                  0
                </span>
              </div>
            </div>
          ) : null}

          <div className="flex min-h-0 flex-1">
            <section className="min-h-0 w-[320px] shrink-0 overflow-hidden border-r border-[var(--z-border)] bg-[var(--z-panel)]">
              {leftPanel}
            </section>

            <section className="flex min-h-0 min-w-0 flex-1 flex-col">
              {centerHeader ? (
                <div className="border-b border-[var(--z-border)] bg-[var(--z-panel)]">
                  {centerHeader}
                </div>
              ) : null}
              <div className="flex min-h-0 flex-1 min-w-0">{center}</div>
            </section>

            <aside className="min-h-0 w-[360px] shrink-0 overflow-hidden border-l border-[var(--z-border)] bg-[var(--z-panel)]">
              {rightPanel}
            </aside>
          </div>
        </main>
      </div>
    </div>
  );
}

