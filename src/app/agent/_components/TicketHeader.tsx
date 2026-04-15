import type { Ticket } from "@/lib/mockTickets";
import { Badge } from "@/app/agent/_components/ui/Badge";
import { MoreHorizontal, RefreshCcw, SlidersHorizontal } from "lucide-react";

export function TicketHeader({ ticket }: { ticket: Ticket }) {
  return (
    <div className="flex items-start justify-between gap-4 px-5 py-4">
      <div className="min-w-0">
        <div className="flex items-center gap-2">
          <div className="text-sm font-semibold text-slate-900">
            {ticket.subject}
          </div>
          <Badge variant="danger" className="uppercase">
            {ticket.status}
          </Badge>
        </div>
        <div className="mt-1 text-xs text-slate-500">
          Via web form · {ticket.requester.name}, {ticket.requester.orgName}
        </div>
      </div>

      <div className="flex shrink-0 items-center gap-2">
        <button
          type="button"
          className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-[var(--z-border)] bg-white text-slate-600 hover:bg-[var(--z-hover)]"
          aria-label="Ticket tools"
        >
          <SlidersHorizontal className="h-4 w-4" />
        </button>
        <button
          type="button"
          className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-[var(--z-border)] bg-white text-slate-600 hover:bg-[var(--z-hover)]"
          aria-label="Refresh"
        >
          <RefreshCcw className="h-4 w-4" />
        </button>
        <button
          type="button"
          className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-[var(--z-border)] bg-white text-slate-600 hover:bg-[var(--z-hover)]"
          aria-label="More"
        >
          <MoreHorizontal className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}

