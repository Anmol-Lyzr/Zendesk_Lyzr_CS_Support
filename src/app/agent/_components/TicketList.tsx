"use client";

import Link from "next/link";
import { cn } from "@/lib/cn";
import type { Ticket } from "@/lib/mockTickets";

export function TicketList({
  tickets,
  selectedTicketId,
}: {
  tickets: Ticket[];
  selectedTicketId: string;
}) {
  return (
    <div className="flex min-w-0 flex-1 items-center gap-2 overflow-hidden">
      <div className="shrink-0 rounded-md bg-amber-400 px-2 py-1 text-xs font-semibold text-slate-900">
        Open
      </div>
      <div className="shrink-0 min-w-0 text-sm font-semibold text-slate-900">
        Ticket #{selectedTicketId}
      </div>
      <div
        className="ticket-tabs-scroll ml-1 min-w-0 flex-1 overflow-x-auto overflow-y-hidden touch-pan-x"
        role="navigation"
        aria-label="Open tickets"
      >
        {/* Inner column: chips row + spacer row pushes the horizontal scrollbar below the labels */}
        <div className="flex w-max min-w-0 flex-col gap-0">
          <div className="flex items-center gap-2 py-0.5">
            {tickets.map((t) => (
              <Link
                key={t.id}
                href={`/agent/tickets/${t.id}`}
                className={cn(
                  "flex shrink-0 items-center gap-2 rounded-full border px-2.5 py-1.5 text-xs leading-tight transition-colors",
                  t.id === selectedTicketId
                    ? "border-[var(--z-border)] bg-white text-slate-900 shadow-sm"
                    : "border-transparent bg-transparent text-slate-700 hover:bg-[var(--z-hover)]"
                )}
                title={t.subject}
              >
                <span className="font-semibold">#{t.id}</span>
                <span className="max-w-[160px] truncate">{t.subject}</span>
              </Link>
            ))}
          </div>
          {/* Reserved band so native scrollbars render under the chips, not over them */}
          <div
            className="h-4 w-full min-w-full shrink-0"
            aria-hidden="true"
          />
        </div>
      </div>
    </div>
  );
}

