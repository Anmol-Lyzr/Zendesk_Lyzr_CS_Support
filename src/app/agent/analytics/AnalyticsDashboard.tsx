"use client";

import * as React from "react";
import { Button } from "@/app/agent/_components/ui/Button";
import { Badge } from "@/app/agent/_components/ui/Badge";
import Link from "next/link";
import { cn } from "@/lib/cn";

type WeeklyCategory = {
  key: string;
  label: string;
  count: number;
  delta?: number;
};

type WeeklyRollup = {
  weekStart: string; // YYYY-MM-DD
  weekEnd: string; // YYYY-MM-DD
  totals: {
    tickets: number;
    open: number;
    solved: number;
    urgent: number;
    recurring: number;
  };
  topIssues: WeeklyCategory[];
};

type PatternsResponse = {
  weekStart: string;
  weekEnd: string;
  patterns: Array<{
    title: string;
    count: number;
    evidence_ticket_ids: string[];
    recommended_actions: string[];
    severity?: "low" | "medium" | "high";
  }>;
};

type FeatureRequestsResponse = {
  weekStart: string;
  weekEnd: string;
  requests: Array<{
    id: string;
    title: string;
    description: string;
    theme: string;
    impact: string;
    confidence: number;
    evidence_ticket_ids: string[];
    pushed_to_salesforce?: boolean;
  }>;
};

function formatWeekLabel(weekStart: string, weekEnd: string) {
  return `${weekStart} → ${weekEnd}`;
}

function SparkBars({ values }: { values: number[] }) {
  const max = Math.max(1, ...values);
  return (
    <div className="flex items-end gap-1">
      {values.map((v, idx) => (
        <div
          // eslint-disable-next-line react/no-array-index-key
          key={idx}
          className="w-2 rounded-sm bg-[color-mix(in_srgb,var(--z-brand)_70%,white)]"
          style={{ height: `${Math.max(3, Math.round((v / max) * 28))}px` }}
        />
      ))}
    </div>
  );
}

function Section({
  title,
  subtitle,
  right,
  children,
}: {
  title: string;
  subtitle?: string;
  right?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-xl border border-[var(--z-border)] bg-white">
      <div className="flex items-start justify-between gap-3 border-b border-[var(--z-border)] px-4 py-3">
        <div>
          <div className="text-sm font-semibold text-slate-900">{title}</div>
          {subtitle ? (
            <div className="mt-0.5 text-xs text-slate-500">{subtitle}</div>
          ) : null}
        </div>
        {right ? <div className="shrink-0">{right}</div> : null}
      </div>
      <div className="p-4">{children}</div>
    </section>
  );
}

export function AnalyticsDashboard() {
  const [weekly, setWeekly] = React.useState<WeeklyRollup[] | null>(null);
  const [weeklyError, setWeeklyError] = React.useState<string | null>(null);
  const [selectedWeekStart, setSelectedWeekStart] = React.useState<string | null>(
    null
  );

  const [patterns, setPatterns] = React.useState<PatternsResponse | null>(null);
  const [patternsError, setPatternsError] = React.useState<string | null>(null);
  const [patternsLoading, setPatternsLoading] = React.useState(false);

  const [featureRequests, setFeatureRequests] =
    React.useState<FeatureRequestsResponse | null>(null);
  const [featureError, setFeatureError] = React.useState<string | null>(null);
  const [featureLoading, setFeatureLoading] = React.useState(false);

  const [pushState, setPushState] = React.useState<
    Record<string, "idle" | "pushing" | "success" | "error">
  >({});

  React.useEffect(() => {
    let cancelled = false;
    async function run() {
      setWeeklyError(null);
      try {
        const res = await fetch("/api/analytics/weekly", { cache: "no-store" });
        if (!res.ok) {
          throw new Error(`Weekly rollup failed (${res.status})`);
        }
        const data = (await res.json()) as { weeks: WeeklyRollup[] };
        if (cancelled) return;
        setWeekly(data.weeks);
        setSelectedWeekStart((prev) => prev ?? data.weeks?.[0]?.weekStart ?? null);
      } catch (e) {
        if (cancelled) return;
        setWeeklyError(e instanceof Error ? e.message : "Failed to load weekly rollup");
        setWeekly(null);
      }
    }
    run();
    return () => {
      cancelled = true;
    };
  }, []);

  const selectedWeek = React.useMemo(() => {
    if (!weekly || !selectedWeekStart) return null;
    return weekly.find((w) => w.weekStart === selectedWeekStart) ?? null;
  }, [weekly, selectedWeekStart]);

  const kpi = React.useMemo(() => {
    const patternsCount = patterns?.patterns?.length ?? 0;
    const featureCount = featureRequests?.requests?.length ?? 0;
    const urgent = selectedWeek?.totals.urgent ?? null;
    const recurring = selectedWeek?.totals.recurring ?? null;
    return { patternsCount, featureCount, urgent, recurring };
  }, [patterns?.patterns?.length, featureRequests?.requests?.length, selectedWeek?.totals]);

  React.useEffect(() => {
    if (!selectedWeek) return;
    let cancelled = false;

    async function loadPatterns() {
      setPatternsLoading(true);
      setPatternsError(null);
      try {
        const res = await fetch("/api/analytics/patterns", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({
            weekStart: selectedWeek.weekStart,
            weekEnd: selectedWeek.weekEnd,
          }),
        });
        if (!res.ok) throw new Error(`Patterns failed (${res.status})`);
        const data = (await res.json()) as PatternsResponse;
        if (cancelled) return;
        setPatterns(data);
      } catch (e) {
        if (cancelled) return;
        setPatterns(null);
        setPatternsError(e instanceof Error ? e.message : "Failed to load patterns");
      } finally {
        if (!cancelled) setPatternsLoading(false);
      }
    }

    async function loadFeatureRequests() {
      setFeatureLoading(true);
      setFeatureError(null);
      try {
        const res = await fetch("/api/analytics/feature-requests", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({
            weekStart: selectedWeek.weekStart,
            weekEnd: selectedWeek.weekEnd,
          }),
        });
        if (!res.ok) throw new Error(`Feature requests failed (${res.status})`);
        const data = (await res.json()) as FeatureRequestsResponse;
        if (cancelled) return;
        setFeatureRequests(data);
      } catch (e) {
        if (cancelled) return;
        setFeatureRequests(null);
        setFeatureError(
          e instanceof Error ? e.message : "Failed to load feature requests"
        );
      } finally {
        if (!cancelled) setFeatureLoading(false);
      }
    }

    loadPatterns();
    loadFeatureRequests();

    return () => {
      cancelled = true;
    };
  }, [selectedWeek?.weekStart, selectedWeek?.weekEnd]);

  async function pushToSalesforce(requestId: string) {
    setPushState((s) => ({ ...s, [requestId]: "pushing" }));
    try {
      const req = featureRequests?.requests.find((r) => r.id === requestId);
      const res = await fetch("/api/integrations/salesforce/push-feature-request", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ request: req, requestId }),
      });
      if (!res.ok) throw new Error(`Push failed (${res.status})`);
      setPushState((s) => ({ ...s, [requestId]: "success" }));
      window.setTimeout(() => {
        setPushState((s) => ({ ...s, [requestId]: "idle" }));
      }, 2500);
    } catch {
      setPushState((s) => ({ ...s, [requestId]: "error" }));
      window.setTimeout(() => {
        setPushState((s) => ({ ...s, [requestId]: "idle" }));
      }, 2500);
    }
  }

  const weeklyBars = React.useMemo(() => {
    if (!weekly) return [];
    return weekly
      .slice()
      .reverse()
      .map((w) => w.totals.tickets);
  }, [weekly]);

  return (
    <div className="min-h-0 flex-1 overflow-auto p-5">
      <div className="rounded-2xl border border-[color-mix(in_srgb,var(--z-brand)_25%,white)] bg-[linear-gradient(135deg,color-mix(in_srgb,var(--z-brand)_18%,white),white_60%)] p-5">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <div className="text-sm font-semibold tracking-tight text-slate-900">
              Agent Analytics Overview
            </div>
            <div className="mt-1 text-xs text-slate-600">
              Weekly patterns and product signals extracted from support tickets.
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {weekly?.slice(0, 6).map((w) => {
              const selected = w.weekStart === selectedWeekStart;
              return (
                <button
                  key={w.weekStart}
                  type="button"
                  onClick={() => setSelectedWeekStart(w.weekStart)}
                  className={cn(
                    "rounded-full border px-3 py-1 text-xs transition-colors",
                    selected
                      ? "border-[color-mix(in_srgb,var(--z-brand)_35%,white)] bg-[color-mix(in_srgb,var(--z-brand)_10%,white)] text-slate-900"
                      : "border-[var(--z-border)] bg-white text-slate-700 hover:bg-[var(--z-hover)]"
                  )}
                  title={formatWeekLabel(w.weekStart, w.weekEnd)}
                >
                  {w.weekStart}
                </button>
              );
            })}
          </div>
        </div>

        <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-5">
          <div className="rounded-xl border border-[var(--z-border)] bg-white p-4">
            <div className="text-xs text-slate-500">Tickets analyzed</div>
            <div className="mt-2 text-2xl font-semibold text-slate-900">
              {selectedWeek?.totals.tickets ?? "—"}
            </div>
          </div>
          <div className="rounded-xl border border-[var(--z-border)] bg-white p-4">
            <div className="text-xs text-slate-500">Urgent signals</div>
            <div className="mt-2 text-2xl font-semibold text-slate-900">
              {kpi.urgent ?? "—"}
            </div>
          </div>
          <div className="rounded-xl border border-[var(--z-border)] bg-white p-4">
            <div className="text-xs text-slate-500">Recurring issues</div>
            <div className="mt-2 text-2xl font-semibold text-slate-900">
              {kpi.recurring ?? "—"}
            </div>
          </div>
          <div className="rounded-xl border border-[var(--z-border)] bg-white p-4">
            <div className="text-xs text-slate-500">Patterns detected</div>
            <div className="mt-2 text-2xl font-semibold text-slate-900">
              {kpi.patternsCount || "—"}
            </div>
          </div>
          <div className="rounded-xl border border-[var(--z-border)] bg-white p-4">
            <div className="flex items-center justify-between gap-3">
              <div className="text-xs text-slate-500">Weekly trend</div>
              <span className="text-[11px] text-slate-400">last {weeklyBars.length}</span>
            </div>
            <div className="mt-3">
              <SparkBars values={weeklyBars} />
            </div>
          </div>
        </div>
      </div>

      <div className="mt-5 grid grid-cols-1 gap-5 xl:grid-cols-3">
        <div className="space-y-5 xl:col-span-2">
          <Section
            title="Issue pattern recognition"
            subtitle={
              selectedWeek
                ? `Insights for ${formatWeekLabel(
                    selectedWeek.weekStart,
                    selectedWeek.weekEnd
                  )}`
                : "Select a week to see insights"
            }
            right={
              patternsLoading ? (
                <Badge variant="info">Analyzing…</Badge>
              ) : patternsError ? (
                <Badge variant="danger">Error</Badge>
              ) : (
                <Badge variant="success">Ready</Badge>
              )
            }
          >
            {weeklyError ? (
              <div className="rounded-md border border-rose-200 bg-rose-50 p-3 text-sm text-rose-800">
                {weeklyError}
              </div>
            ) : null}

            {patternsError ? (
              <div className="rounded-md border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900">
                {patternsError}
              </div>
            ) : null}

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div className="rounded-lg border border-[var(--z-border)] bg-white p-3">
                <div className="text-xs font-semibold text-slate-700">
                  Top issue categories
                </div>
                <div className="mt-3 space-y-2">
                  {selectedWeek?.topIssues?.length ? (
                    selectedWeek.topIssues.slice(0, 6).map((c) => (
                      <div key={c.key} className="flex items-center justify-between gap-3">
                        <div className="min-w-0 text-sm text-slate-700">
                          <span className="truncate">{c.label}</span>
                        </div>
                        <div className="shrink-0 text-xs text-slate-600">
                          <span className="font-semibold text-slate-900">
                            {c.count}
                          </span>
                          {typeof c.delta === "number" ? (
                            <span
                              className={cn(
                                "ml-2",
                                c.delta > 0
                                  ? "text-rose-600"
                                  : c.delta < 0
                                  ? "text-[var(--z-brand)]"
                                  : "text-slate-500"
                              )}
                            >
                              {c.delta > 0 ? `+${c.delta}` : `${c.delta}`}
                            </span>
                          ) : null}
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="rounded-md border border-[var(--z-border)] bg-slate-50 p-2 text-xs text-slate-600">
                      No data yet.
                    </div>
                  )}
                </div>
              </div>

              <div className="rounded-lg border border-[var(--z-border)] bg-white p-3">
                <div className="text-xs font-semibold text-slate-700">
                  Actionable patterns
                </div>
                <div className="mt-3 space-y-3">
                  {patterns?.patterns?.length ? (
                    patterns.patterns.slice(0, 4).map((p) => (
                      <div
                        key={p.title}
                        className="rounded-md border border-[var(--z-border)] bg-white p-3"
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0">
                            <div className="truncate text-sm font-semibold text-slate-900">
                              {p.title}
                            </div>
                            <div className="mt-1 text-xs text-slate-600">
                              {p.count} tickets • Evidence:{" "}
                              {p.evidence_ticket_ids.slice(0, 3).map((id) => (
                                <Link
                                  key={id}
                                  href={`/agent/tickets/${id}`}
                                  className="text-[var(--z-brand)] hover:underline"
                                >
                                  #{id}
                                </Link>
                              ))}
                            </div>
                          </div>
                          {p.severity ? (
                            <Badge
                              variant={
                                p.severity === "high"
                                  ? "danger"
                                  : p.severity === "medium"
                                  ? "warning"
                                  : "info"
                              }
                            >
                              {p.severity}
                            </Badge>
                          ) : null}
                        </div>
                        {p.recommended_actions?.length ? (
                          <ul className="mt-2 list-disc pl-5 text-xs text-slate-700">
                            {p.recommended_actions.slice(0, 3).map((a) => (
                              <li key={a}>{a}</li>
                            ))}
                          </ul>
                        ) : null}
                      </div>
                    ))
                  ) : (
                    <div className="rounded-md border border-[var(--z-border)] bg-slate-50 p-2 text-xs text-slate-600">
                      {patternsLoading ? "Analyzing tickets…" : "No patterns found."}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </Section>
        </div>

        <div className="space-y-5">
          <Section
            title="Feature requests"
            subtitle="Detected product requests you can push to Salesforce"
            right={
              featureLoading ? (
                <Badge variant="info">Extracting…</Badge>
              ) : featureError ? (
                <Badge variant="danger">Error</Badge>
              ) : (
                <Badge variant="success">Ready</Badge>
              )
            }
          >
            {featureError ? (
              <div className="rounded-md border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900">
                {featureError}
              </div>
            ) : null}

            <div className="space-y-3">
              {featureRequests?.requests?.length ? (
                featureRequests.requests.slice(0, 8).map((r) => {
                  const state = pushState[r.id] ?? "idle";
                  return (
                    <div
                      key={r.id}
                      className="rounded-lg border border-[var(--z-border)] bg-white p-3"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <div className="truncate text-sm font-semibold text-slate-900">
                            {r.title}
                          </div>
                          <div className="mt-1 text-xs text-slate-600">
                            <span className="font-medium text-slate-700">
                              Theme:
                            </span>{" "}
                            {r.theme} •{" "}
                            <span className="font-medium text-slate-700">
                              Impact:
                            </span>{" "}
                            {r.impact}
                          </div>
                        </div>
                        <Badge variant="neutral">
                          {Math.round(r.confidence * 100)}%
                        </Badge>
                      </div>

                      <div className="mt-2 text-xs leading-5 text-slate-700">
                        {r.description}
                      </div>

                      <div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-slate-600">
                        <span className="font-medium text-slate-700">
                          Evidence:
                        </span>
                        {r.evidence_ticket_ids.slice(0, 4).map((id) => (
                          <Link
                            key={id}
                            href={`/agent/tickets/${id}`}
                            className="text-[var(--z-brand)] hover:underline"
                          >
                            #{id}
                          </Link>
                        ))}
                      </div>

                      <div className="mt-3 flex items-center gap-2">
                        <Button
                          variant="primary"
                          size="sm"
                          disabled={state === "pushing"}
                          onClick={() => pushToSalesforce(r.id)}
                        >
                          {state === "pushing"
                            ? "Pushing…"
                            : "Push to Salesforce"}
                        </Button>
                        {state === "success" ? (
                          <Badge variant="success">Synced</Badge>
                        ) : state === "error" ? (
                          <Badge variant="danger">Failed</Badge>
                        ) : null}
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="rounded-md border border-[var(--z-border)] bg-slate-50 p-2 text-xs text-slate-600">
                  {featureLoading
                    ? "Extracting feature requests…"
                    : "No feature requests found for this week."}
                </div>
              )}
            </div>
          </Section>
        </div>
      </div>
    </div>
  );
}

