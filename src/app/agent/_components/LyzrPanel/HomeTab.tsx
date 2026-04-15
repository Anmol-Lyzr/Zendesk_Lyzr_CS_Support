"use client";

import type { Ticket } from "@/lib/mockTickets";
import { Button } from "@/app/agent/_components/ui/Button";
import { Badge } from "@/app/agent/_components/ui/Badge";
import { useDraftStore } from "@/app/agent/_state/draftStore";

type HomeInsights = {
  summary: string;
  issueReported: string;
  nextSteps: string[];
  draftResponse: string;
};

export function HomeTab({
  ticket,
  insights,
  isLoading,
}: {
  ticket: Ticket;
  insights: HomeInsights;
  isLoading: boolean;
}) {
  const { fillDraftIfEmpty } = useDraftStore();

  return (
    <div className="space-y-4">
      <section className="rounded-lg border border-[var(--z-border)] bg-white p-3">
        <div className="flex items-center justify-between">
          <div className="text-sm font-semibold text-slate-900">Summary</div>
          <div className="text-xs text-slate-500">{isLoading ? "Updating…" : "Just now"}</div>
        </div>
        <div className="mt-2 text-sm leading-6 text-slate-700">
          {insights.summary}
        </div>
        <div className="mt-3 text-xs text-slate-500">
          <span className="font-semibold text-slate-700">Issue Reported:</span>{" "}
          {insights.issueReported}
        </div>
      </section>

      <section className="rounded-lg border border-[var(--z-border)] bg-white p-3">
        <div className="flex items-center justify-between">
          <div className="text-sm font-semibold text-slate-900">Next steps</div>
          <div className="text-xs text-slate-500">{isLoading ? "Updating…" : "Just now"}</div>
        </div>
        <ol className="mt-2 space-y-2 text-sm text-slate-700">
          {insights.nextSteps.map((s, idx) => (
            <li key={s} className="flex gap-2">
              <span className="mt-0.5 inline-flex h-5 w-5 items-center justify-center rounded-full bg-slate-100 text-[11px] font-semibold text-slate-700">
                {idx + 1}
              </span>
              <span className="leading-6">{s}</span>
            </li>
          ))}
        </ol>
      </section>

      <section className="rounded-lg border border-[var(--z-border)] bg-white p-3">
        <div className="flex items-center justify-between">
          <div className="text-sm font-semibold text-slate-900">
            Draft a response
          </div>
          <Badge variant="info">Suggested reply</Badge>
        </div>
        <div className="mt-2 text-sm text-slate-600">
          Generate a customer-ready reply and place it in the composer.
        </div>
        <div className="mt-3">
          <Button
            variant="primary"
            onClick={() => fillDraftIfEmpty(ticket.id, insights.draftResponse)}
          >
            Draft a response
          </Button>
        </div>
      </section>
    </div>
  );
}

