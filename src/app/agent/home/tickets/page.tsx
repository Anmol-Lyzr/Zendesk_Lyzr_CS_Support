import { tickets } from "@/lib/mockTickets";
import { AgentShell } from "@/app/agent/_components/AgentShell";
import Link from "next/link";
import { formatShortDate } from "@/lib/dates";
import {
  ChevronDown,
  Headphones,
  Home,
  Plus,
  Search,
  SlidersHorizontal,
} from "lucide-react";

function initials(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (!parts.length) return "U";
  const a = parts[0]?.[0] ?? "U";
  const b = parts.length > 1 ? parts[parts.length - 1]?.[0] ?? "" : "";
  return (a + b).toUpperCase();
}

export default function TicketsHomePage() {
  const ordered = tickets
    .slice()
    .sort((a, b) => (a.updatedAt < b.updatedAt ? 1 : -1));

  const openCount = ordered.filter((t) => t.status === "open").length;

  return (
    <AgentShell
      leftRail={<div />}
      leftPanel={
        <div className="flex h-full flex-col">
          <div className="px-4 py-4">
            <div className="text-xs font-semibold text-slate-600">Your work</div>
            <div className="mt-2 space-y-1">
              <Link
                href="/agent/home/tickets"
                className="flex items-center gap-2 rounded-md border border-[color-mix(in_srgb,var(--z-brand)_12%,white)] bg-[color-mix(in_srgb,var(--z-brand)_7%,white)] px-3 py-2 text-sm font-medium text-slate-900"
              >
                <Home className="h-4 w-4 text-[var(--z-brand)]" />
                <span>Tickets</span>
              </Link>
            </div>
          </div>

          <div className="px-4 py-2">
            <div className="text-xs font-semibold text-slate-600">
              Shared work
            </div>
            <div className="mt-2 space-y-1">
              <button
                type="button"
                className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-left text-sm text-slate-700 hover:bg-[var(--z-hover)]"
              >
                <Headphones className="h-4 w-4 text-slate-600" />
                <span>CC&apos;d</span>
              </button>
              <button
                type="button"
                className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-left text-sm text-slate-700 hover:bg-[var(--z-hover)]"
              >
                <Search className="h-4 w-4 text-slate-600" />
                <span>Following</span>
              </button>
            </div>
          </div>

          <div className="px-4 py-4">
            <div className="text-xs font-semibold text-slate-600">
              Completed work
            </div>
            <button
              type="button"
              className="mt-2 flex w-full items-center gap-2 rounded-md px-3 py-2 text-left text-sm text-slate-700 hover:bg-[var(--z-hover)]"
            >
              <span className="inline-flex h-5 w-5 items-center justify-center rounded bg-slate-100 text-[10px] font-semibold text-slate-700">
                30
              </span>
              <span>Last 30 days</span>
            </button>
          </div>
        </div>
      }
      centerHeader={
        <div className="border-b border-[var(--z-border)] bg-white">
          <div className="flex items-center justify-between px-5 py-4">
            <div className="text-sm font-semibold text-slate-900">
              {ordered.length} tickets
            </div>
            <div className="flex items-center gap-3 text-xs text-slate-600">
              <button
                type="button"
                className="inline-flex items-center gap-1 rounded-md px-2 py-1 hover:bg-[var(--z-hover)]"
              >
                Status <SlidersHorizontal className="h-3.5 w-3.5" />
              </button>
              <button
                type="button"
                className="inline-flex items-center gap-1 rounded-md px-2 py-1 hover:bg-[var(--z-hover)]"
              >
                Channel <SlidersHorizontal className="h-3.5 w-3.5" />
              </button>
              <button
                type="button"
                className="inline-flex items-center gap-1 rounded-md px-2 py-1 hover:bg-[var(--z-hover)]"
              >
                Recommended <ChevronDown className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>
        </div>
      }
      center={
        <div className="flex min-h-0 flex-1 flex-col bg-white">
          {/* Make the middle pane scroll instead of clipping */}
          <div className="min-h-0 flex-1 overflow-auto">
            <ul className="divide-y divide-[var(--z-border)]">
              {ordered.map((t) => (
                <li key={t.id}>
                  <Link
                    href={`/agent/tickets/${t.id}`}
                    className="block px-5 py-4 hover:bg-[var(--z-hover)]"
                  >
                    <div className="flex gap-3">
                      <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-emerald-50 text-xs font-semibold text-emerald-700">
                        {initials(t.requester.name)}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0">
                            <div
                              className="text-sm font-semibold text-slate-900"
                              style={{
                                display: "-webkit-box",
                                WebkitLineClamp: 2,
                                WebkitBoxOrient: "vertical",
                                overflow: "hidden",
                              }}
                            >
                              {t.requester.name} | {t.subject}
                            </div>
                            <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-slate-500">
                              <span className="inline-flex items-center gap-1">
                                <span className="h-1.5 w-1.5 rounded-full bg-rose-500" />
                                {t.status === "open" ? "Open" : t.status}
                              </span>
                              <span className="min-w-0 break-words">
                                Open Lyzr_AI_DRAFT v1 | Ticket summary | Subject:{" "}
                                {t.subject}
                              </span>
                            </div>
                          </div>
                          <div className="shrink-0 text-xs text-slate-500">
                            {formatShortDate(t.updatedAt)} | #{t.id}
                          </div>
                        </div>
                      </div>
                    </div>
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>
      }
      rightPanel={
        <div className="flex h-full flex-col gap-4 overflow-auto bg-[var(--z-canvas)] p-4">
          <section className="overflow-hidden rounded-lg border border-[var(--z-border)] bg-white">
            <div className="border-b border-[var(--z-border)] px-4 py-3">
              <div className="text-xs font-semibold text-slate-600">
                Setup guide
              </div>
              <div className="mt-0.5 text-sm font-semibold text-slate-900">
                AI agents
              </div>
            </div>
            <div className="space-y-2 px-4 py-3 text-sm">
              {[
                { label: "Invite team", action: "Continue" },
                { label: "Add content", action: "View" },
                { label: "Name and tone of voice", action: "View" },
                { label: "Test AI agent", action: "View" },
                { label: "Connect email", action: "Start" },
                { label: "Launch AI agent", action: "" },
              ].map((row) => (
                <div key={row.label} className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2 text-slate-700">
                    <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-emerald-50 text-[11px] font-semibold text-emerald-700">
                      ✓
                    </span>
                    <span className="truncate">{row.label}</span>
                  </div>
                  {row.action ? (
                    <button
                      type="button"
                      className="shrink-0 text-xs font-medium text-[var(--z-brand)] hover:underline"
                    >
                      {row.action}
                    </button>
                  ) : (
                    <span className="shrink-0 text-xs text-slate-400"> </span>
                  )}
                </div>
              ))}
            </div>
            <div className="border-t border-[var(--z-border)] px-4 py-3 text-center">
              <button
                type="button"
                className="text-xs font-medium text-[var(--z-brand)] hover:underline"
              >
                View all setup guides →
              </button>
            </div>
          </section>

          <section className="rounded-lg border border-[var(--z-border)] bg-white p-4">
            <div className="text-xs font-semibold text-slate-700">
              Ticket statistics
            </div>
            <div className="mt-1 text-xs text-slate-500">This week</div>
            <div className="mt-4 text-center">
              <div className="text-2xl font-semibold text-slate-900">0</div>
              <div className="text-sm text-slate-600">Solved</div>
            </div>
          </section>

          <section className="rounded-lg border border-[var(--z-border)] bg-white p-4">
            <div className="text-xs font-semibold text-slate-700">
              Open tickets
            </div>
            <div className="mt-4 text-center">
              <div className="text-2xl font-semibold text-slate-900">
                {openCount}
              </div>
            </div>
            <div className="mt-3 flex justify-center">
              <button
                type="button"
                className="inline-flex items-center gap-2 rounded-md border border-[var(--z-border)] bg-white px-3 py-2 text-sm font-medium text-slate-700 hover:bg-[var(--z-hover)]"
              >
                <Plus className="h-4 w-4" />
                Add
              </button>
            </div>
          </section>
        </div>
      }
    />
  );
}

