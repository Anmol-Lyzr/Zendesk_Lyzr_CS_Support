"use client";

import * as React from "react";
import type { Ticket } from "@/lib/mockTickets";
import { Button } from "@/app/agent/_components/ui/Button";
import { SentimentCard } from "@/app/agent/_components/LyzrPanel/SentimentCard";
import { Badge } from "@/app/agent/_components/ui/Badge";

type KbArticle = {
  id: string;
  title: string;
  url: string;
  why_relevant: string;
  confidence: number;
};

type OthersInsights = {
  issueReported: string;
  nextSteps: string[];
  kbArticles: KbArticle[];
  sentiment: Ticket["lyzr"]["sentiment"];
};

export function OthersTab({
  ticket,
  insights,
  isLoading,
}: {
  ticket: Ticket;
  insights: OthersInsights;
  isLoading: boolean;
}) {
  const [pushStatus, setPushStatus] = React.useState<
    "idle" | "pushing" | "success" | "error"
  >("idle");

  return (
    <div className="space-y-4">
      <section className="rounded-lg border border-[var(--z-border)] bg-white p-3">
        <div className="text-sm font-semibold text-slate-900">
          Create a KB article from the ticket
        </div>
        <div className="mt-2 space-y-2 text-sm text-slate-700">
          <div>
            <div className="text-xs font-medium text-slate-500">Title</div>
            <div className="mt-1 rounded-md border border-[var(--z-border)] bg-slate-50 px-2 py-2 text-sm">
              {ticket.subject}
            </div>
          </div>
          <div>
            <div className="text-xs font-medium text-slate-500">Article draft</div>
            <div className="mt-1 rounded-md border border-[var(--z-border)] bg-slate-50 px-2 py-2 text-sm leading-6">
              <div className="font-semibold">Problem</div>
              <div className="mt-1">{insights.issueReported}</div>
              <div className="mt-3 font-semibold">Resolution steps</div>
              <ol className="mt-1 list-decimal pl-5">
                {insights.nextSteps.slice(0, 3).map((s) => (
                  <li key={s}>{s}</li>
                ))}
              </ol>
            </div>
          </div>
          <Button variant="secondary">Create KB article</Button>
        </div>
      </section>

      <section className="rounded-lg border border-[var(--z-border)] bg-white p-3">
        <div className="flex items-center justify-between">
          <div className="text-sm font-semibold text-slate-900">KB articles</div>
          <div className="text-xs text-slate-500">{isLoading ? "Updating…" : "Suggested"}</div>
        </div>
        <div className="mt-2 space-y-2 text-sm text-slate-700">
          {insights.kbArticles.length ? (
            insights.kbArticles.map((a) => (
              <a
                key={a.id}
                href={a.url}
                target="_blank"
                rel="noreferrer"
                className="block rounded-md border border-[var(--z-border)] bg-white p-2 hover:bg-slate-50"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <div className="truncate font-semibold text-slate-900">{a.title}</div>
                    <div className="mt-0.5 text-xs text-slate-600">{a.why_relevant}</div>
                  </div>
                  <div className="shrink-0 text-xs text-slate-500">
                    {Math.round(a.confidence * 100)}%
                  </div>
                </div>
              </a>
            ))
          ) : (
            <div className="rounded-md border border-[var(--z-border)] bg-slate-50 p-2 text-xs text-slate-600">
              No relevant KB articles found.
            </div>
          )}
        </div>
      </section>

      <section className="rounded-lg border border-[var(--z-border)] bg-white p-3">
        <div className="text-sm font-semibold text-slate-900">
          Customer Sentiment Analysis
        </div>
        <div className="mt-3">
          <SentimentCard sentiment={insights.sentiment} />
        </div>
      </section>

      <section className="rounded-lg border border-[var(--z-border)] bg-white p-3">
        <div className="text-sm font-semibold text-slate-900">
          Push to Salesforce
        </div>
        <div className="mt-2 text-sm text-slate-600">
          Creates or updates a Salesforce case from this ticket for your revenue and success teams.
        </div>
        <div className="mt-3 flex items-center gap-2">
          <Button
            variant="primary"
            disabled={pushStatus === "pushing"}
            onClick={async () => {
              setPushStatus("pushing");
              try {
                const res = await fetch(
                  "/api/integrations/salesforce/push-feature-request",
                  {
                    method: "POST",
                    headers: { "content-type": "application/json" },
                    body: JSON.stringify({
                      requestId: `ticket-${ticket.id}`,
                      request: {
                        title: ticket.subject,
                        description: [
                          `Ticket #${ticket.id}`,
                          `Reported issue: ${insights.issueReported}`,
                          "",
                          "Top next steps:",
                          ...insights.nextSteps.slice(0, 5).map((s) => `- ${s}`),
                        ].join("\n"),
                        theme: "Support ticket",
                        impact: ticket.isUrgent ? "High" : "Medium",
                        confidence: 0.9,
                        evidence_ticket_ids: [ticket.id],
                      },
                    }),
                  }
                );
                if (!res.ok) throw new Error(String(res.status));
                setPushStatus("success");
                window.setTimeout(() => setPushStatus("idle"), 2500);
              } catch {
                setPushStatus("error");
                window.setTimeout(() => setPushStatus("idle"), 2500);
              }
            }}
          >
            {pushStatus === "pushing" ? "Pushing…" : "Push ticket to Salesforce"}
          </Button>
          {pushStatus === "success" ? (
            <Badge variant="success">Synced to Salesforce</Badge>
          ) : pushStatus === "error" ? (
            <Badge variant="danger">Push failed</Badge>
          ) : null}
        </div>
      </section>
    </div>
  );
}

