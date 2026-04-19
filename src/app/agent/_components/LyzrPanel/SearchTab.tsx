"use client";

import Link from "next/link";
import type { Ticket } from "@/lib/mockTickets";
import { formatShortDate } from "@/lib/dates";
import { Badge } from "@/app/agent/_components/ui/Badge";
import { Search } from "lucide-react";

export function SearchTab({
  ticket,
  allTickets,
}: {
  ticket: Ticket;
  allTickets: Ticket[];
}) {
  const sameCustomer = allTickets
    .filter((t) => t.requester.id === ticket.requester.id)
    .sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1));

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2 rounded-lg border border-[var(--z-border)] bg-white px-3 py-2 text-sm text-slate-600">
        <Search className="h-4 w-4" />
        <span className="truncate">
          Previous tickets for {ticket.requester.name} ({ticket.requester.orgName})
        </span>
      </div>

      <div className="rounded-lg border border-[var(--z-border)] bg-white">
        <div className="border-b border-[var(--z-border)] px-3 py-2">
          <div className="text-sm font-semibold text-slate-900">
            Tickets ({sameCustomer.length})
          </div>
          <div className="text-xs text-slate-500">
            Click a ticket to open it
          </div>
        </div>

        <div className="divide-y divide-[var(--z-border)]">
          {sameCustomer.map((t) => (
            <Link
              key={t.id}
              href={`/agent/tickets/${t.id}`}
              className="block px-3 py-3 hover:bg-slate-50"
            >
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <div className="truncate text-[11px] font-semibold text-slate-500">
                    #{t.id}
                  </div>
                  <div className="truncate text-sm font-semibold text-slate-900">
                    {t.subject}
                  </div>
                  <div className="mt-1 line-clamp-2 text-xs leading-5 text-slate-600">
                    {t.lyzr.summary}
                  </div>
                </div>
                <div className="shrink-0 text-xs text-slate-500">
                  {formatShortDate(t.createdAt)}
                </div>
              </div>
              <div className="mt-2 flex flex-wrap gap-2">
                {t.isRecurring ? (
                  <Badge variant="warning">Recurring issue</Badge>
                ) : null}
                {t.isUrgent ? <Badge variant="danger">Urgent</Badge> : null}
                <Badge variant="neutral">Group {t.similarityGroup}</Badge>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}

