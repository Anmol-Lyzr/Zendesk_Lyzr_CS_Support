"use client";

import * as React from "react";
import Image from "next/image";
import type { Ticket } from "@/lib/mockTickets";
import { Tabs } from "@/app/agent/_components/ui/Tabs";
import { HomeTab } from "@/app/agent/_components/LyzrPanel/HomeTab";
import { SearchTab } from "@/app/agent/_components/LyzrPanel/SearchTab";
import { OthersTab } from "@/app/agent/_components/LyzrPanel/OthersTab";

type LyzrTabKey = "home" | "search" | "others";

type KbArticle = {
  id: string;
  title: string;
  url: string;
  why_relevant: string;
  confidence: number;
};

type TicketInsights = {
  summary: string;
  issue_reported: string;
  next_steps: string[];
  draft_response: string;
  kb_articles: KbArticle[];
};

export function LyzrPanel({
  ticket,
  allTickets,
}: {
  ticket: Ticket;
  allTickets: Ticket[];
}) {
  const [active, setActive] = React.useState<LyzrTabKey>("home");
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [insights, setInsights] = React.useState<TicketInsights | null>(null);

  const load = React.useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/lyzr/insights/${ticket.id}`, { cache: "no-store" });
      const data = (await res.json()) as TicketInsights | { error?: string };
      if (!res.ok) {
        const maybeError =
          typeof (data as { error?: unknown }).error === "string"
            ? (data as { error: string }).error
            : null;
        throw new Error(
          maybeError ?? `Request failed (${res.status})`
        );
      }
      setInsights(data as TicketInsights);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
      setInsights(null);
    } finally {
      setLoading(false);
    }
  }, [ticket.id]);

  React.useEffect(() => {
    void load();
  }, [load]);

  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center justify-between border-b border-[var(--z-border)] px-4 py-3">
        <div className="flex min-w-0 items-center gap-2.5">
          <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-[color-mix(in_srgb,var(--z-brand)_10%,white)]">
            <div className="h-8 w-8 overflow-hidden rounded-xl bg-white shadow-[0_1px_0_rgba(15,23,42,0.04)]">
              <Image
                src="/lyzr-mark.png"
                alt="Lyzr"
                width={64}
                height={64}
                className="h-8 w-8 object-contain"
                priority
              />
            </div>
          </div>
          <div className="min-w-0">
            <div className="truncate text-[15px] font-semibold text-slate-900">
              Lyzr
            </div>
          </div>
        </div>
        <button
          type="button"
          className="rounded-md border border-[var(--z-border)] bg-white px-2 py-1 text-xs text-slate-600 hover:bg-slate-50"
          onClick={() => void load()}
          aria-label="Refresh Lyzr outputs"
        >
          {loading ? "…" : "↻"}
        </button>
      </div>

      <div className="px-4 pt-3">
        <Tabs
          tabs={[
            { key: "home", label: "Home" },
            { key: "search", label: "Search" },
            { key: "others", label: "Others" },
          ]}
          active={active}
          onChange={(k) => setActive(k as LyzrTabKey)}
        />
      </div>

      <div className="min-h-0 flex-1 overflow-auto px-4 py-4">
        {error ? (
          <div className="rounded-lg border border-[var(--z-border)] bg-white p-3 text-sm text-slate-700">
            <div className="font-semibold text-slate-900">Agent error</div>
            <div className="mt-1 text-slate-600">{error}</div>
            <button
              type="button"
              className="mt-3 rounded-md border border-[var(--z-border)] bg-white px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50"
              onClick={() => void load()}
            >
              Retry
            </button>
          </div>
        ) : null}

        {active === "home" ? (
          <HomeTab
            ticket={ticket}
            insights={
              insights
                ? {
                    summary: insights.summary,
                    issueReported: insights.issue_reported,
                    nextSteps: insights.next_steps,
                    draftResponse: insights.draft_response,
                  }
                : ticket.lyzr
            }
            isLoading={loading}
          />
        ) : null}
        {active === "search" ? (
          <SearchTab ticket={ticket} allTickets={allTickets} />
        ) : null}
        {active === "others" ? (
          <OthersTab
            ticket={ticket}
            insights={
              insights
                ? {
                    issueReported: insights.issue_reported,
                    nextSteps: insights.next_steps,
                    kbArticles: insights.kb_articles,
                    sentiment: ticket.lyzr.sentiment,
                  }
                : { issueReported: ticket.lyzr.issueReported, nextSteps: ticket.lyzr.nextSteps, kbArticles: [], sentiment: ticket.lyzr.sentiment }
            }
            isLoading={loading}
          />
        ) : null}
      </div>
    </div>
  );
}

