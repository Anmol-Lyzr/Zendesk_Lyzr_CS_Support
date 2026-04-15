"use client";

import type { Ticket } from "@/lib/mockTickets";
import { Button } from "@/app/agent/_components/ui/Button";
import { Badge } from "@/app/agent/_components/ui/Badge";
import { useDraftStore } from "@/app/agent/_state/draftStore";
import { ChevronRight, FileText, ListChecks, Pencil } from "lucide-react";
import { useMemo, useState } from "react";

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
  const [isSummaryExpanded, setIsSummaryExpanded] = useState(false);
  const [isNextStepsExpanded, setIsNextStepsExpanded] = useState(false);

  const collapsedNextSteps = useMemo(() => insights.nextSteps.slice(0, 2), [insights.nextSteps]);
  const hasMoreNextSteps = insights.nextSteps.length > 2;

  return (
    <div className="space-y-4">
      <section className="rounded-lg border border-[var(--z-border)] bg-white p-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="flex h-6 w-6 items-center justify-center rounded-md bg-slate-100 text-slate-900">
              <FileText className="h-3.5 w-3.5" />
            </div>
            <div className="text-sm font-semibold text-slate-900">Summary</div>
          </div>
          <div className="text-xs text-slate-500">{isLoading ? "Updating…" : "Just now"}</div>
        </div>
        <div
          className={`mt-2 text-sm leading-6 text-slate-700 ${isSummaryExpanded ? "" : "line-clamp-3"}`}
        >
          {insights.summary}
        </div>
        <div className="mt-3 text-xs text-slate-500">
          <span className="font-semibold text-slate-700">Issue Reported:</span>{" "}
          <span className={isSummaryExpanded ? "" : "line-clamp-1"}>{insights.issueReported}</span>
        </div>
        <button
          type="button"
          className="mt-2 inline-flex items-center gap-1 text-xs font-medium text-slate-500 hover:text-[var(--z-brand)]"
          aria-label={isSummaryExpanded ? "Less" : "More"}
          onClick={() => setIsSummaryExpanded((v) => !v)}
        >
          {isSummaryExpanded ? "Less" : "More"} <ChevronRight className={`h-3.5 w-3.5 ${isSummaryExpanded ? "-rotate-90" : ""}`} />
        </button>
      </section>

      <section className="rounded-lg border border-[var(--z-border)] bg-white p-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="flex h-6 w-6 items-center justify-center rounded-md bg-slate-100 text-slate-900">
              <ListChecks className="h-3.5 w-3.5" />
            </div>
            <div className="text-sm font-semibold text-slate-900">Next steps</div>
          </div>
          <div className="text-xs text-slate-500">{isLoading ? "Updating…" : "Just now"}</div>
        </div>
        <ol className="mt-2 space-y-2 text-sm text-slate-700">
          {(isNextStepsExpanded ? insights.nextSteps : collapsedNextSteps).map((s, idx) => (
            <li key={s} className="flex gap-2">
              <span className="mt-0.5 inline-flex h-5 w-5 items-center justify-center rounded-full bg-slate-100 text-[11px] font-semibold text-slate-700">
                {idx + 1}
              </span>
              <span className="leading-6">{s}</span>
            </li>
          ))}
        </ol>
        {hasMoreNextSteps ? (
          <button
            type="button"
            className="mt-2 inline-flex items-center gap-1 text-xs font-medium text-slate-500 hover:text-[var(--z-brand)]"
            aria-label={isNextStepsExpanded ? "Less" : "More"}
            onClick={() => setIsNextStepsExpanded((v) => !v)}
          >
            {isNextStepsExpanded ? "Less" : "More"}{" "}
            <ChevronRight className={`h-3.5 w-3.5 ${isNextStepsExpanded ? "-rotate-90" : ""}`} />
          </button>
        ) : null}
      </section>

      <section className="rounded-lg border border-[var(--z-border)] bg-white p-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="flex h-6 w-6 items-center justify-center rounded-md bg-slate-100 text-slate-900">
              <Pencil className="h-3.5 w-3.5" />
            </div>
            <div className="text-sm font-semibold text-slate-900">Draft a response</div>
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

