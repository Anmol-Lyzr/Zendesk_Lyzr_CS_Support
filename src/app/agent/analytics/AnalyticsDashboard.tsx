"use client";

import * as React from "react";
import { Button } from "@/app/agent/_components/ui/Button";
import { Badge } from "@/app/agent/_components/ui/Badge";
import Link from "next/link";
import { cn } from "@/lib/cn";
import { formatShortDateFromYmd } from "@/lib/dates";
import { ChevronDown } from "lucide-react";
import { getTicket, tickets, type Ticket } from "@/lib/mockTickets";

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
  return `${formatShortDateFromYmd(weekStart)} → ${formatShortDateFromYmd(weekEnd)}`;
}

function toYmd(d: Date) {
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

const FEATURE_REQUEST_CATEGORIES = [
  "All Categories",
  "API",
  "Authentication",
  "Billing",
  "Data Export",
  "Integrations",
  "Mobile App",
  "Notifications",
  "Performance",
  "UI/UX",
  "Other",
] as const;

type FeatureRequestCategory = (typeof FEATURE_REQUEST_CATEGORIES)[number];
type FeatureRequestPriorityLabel = "Low" | "Medium" | "High" | "Critical";
type FeatureRequestStatusLabel = "open" | "resolved";

function normalizeCategoryLabel(label: string): FeatureRequestCategory {
  return (FEATURE_REQUEST_CATEGORIES as readonly string[]).includes(label)
    ? (label as FeatureRequestCategory)
    : "Other";
}

function categoryFromTicket(t: Ticket): FeatureRequestCategory {
  const tags = (t.tags ?? []).map((x) => x.toLowerCase());
  const subject = t.subject.toLowerCase();

  const has = (re: RegExp) => re.test(subject) || tags.some((tag) => re.test(tag));

  if (has(/\bapi\b|openapi|sdk|webhook|429|rate_limit/)) return "API";
  if (has(/auth|oauth|sso|api_key|credential/)) return "Authentication";
  if (has(/bill|invoice|payment|plan|pricing/)) return "Billing";
  if (has(/export|import|csv|download|upload|portable|migration/)) return "Data Export";
  if (has(/integrat|salesforce|slack|jira|zendesk/)) return "Integrations";
  if (has(/mobile|ios|android/)) return "Mobile App";
  if (has(/notif|email|sms|push/)) return "Notifications";
  if (has(/performance|timeout|latency|reliab|websocket|network/)) return "Performance";
  if (has(/\bui\b|ux|dashboard|layout|theme/)) return "UI/UX";
  return "Other";
}

function rollupCategoryFromTickets(tix: Ticket[]): FeatureRequestCategory {
  if (!tix.length) return "Other";
  const counts = new Map<FeatureRequestCategory, number>();
  for (const t of tix) {
    const c = categoryFromTicket(t);
    counts.set(c, (counts.get(c) ?? 0) + 1);
  }
  const ordered = Array.from(counts.entries()).sort((a, b) => b[1] - a[1]);
  return ordered[0]?.[0] ?? "Other";
}

function priorityLabelFromTickets(tix: Ticket[]): FeatureRequestPriorityLabel {
  const rank = (p: Ticket["priority"]) =>
    p === "urgent" ? 3 : p === "high" ? 2 : p === "normal" ? 1 : 0;
  const top = tix.reduce<Ticket["priority"]>(
    (acc, t) => (rank(t.priority) > rank(acc) ? t.priority : acc),
    "low"
  );
  return top === "urgent"
    ? "Critical"
    : top === "high"
    ? "High"
    : top === "normal"
    ? "Medium"
    : "Low";
}

function statusLabelFromTickets(tix: Ticket[]): FeatureRequestStatusLabel {
  if (!tix.length) return "open";
  return tix.every((t) => t.status === "solved") ? "resolved" : "open";
}

function FeatureRequestsBarChart({
  items,
  onSelect,
}: {
  items: Array<{ id: string; title: string; tickets: number }>;
  onSelect: (id: string) => void;
}) {
  const top = items.slice(0, 10);
  const max = Math.max(1, ...top.map((x) => x.tickets));
  const [hovered, setHovered] = React.useState<null | { title: string; tickets: number; x: number; y: number }>(null);

  const padL = 44;
  const padR = 16;
  const padT = 14;
  const padB = 22;
  const w = 980;
  const h = 238;
  const iw = w - padL - padR;
  const ih = h - padT - padB;
  const padLPct = (padL / w) * 100;
  const padRPct = (padR / w) * 100;

  const yTicks = React.useMemo(() => {
    const ticks = 4;
    const step = Math.ceil(max / ticks);
    return Array.from({ length: ticks + 1 }, (_, i) => i * step);
  }, [max]);

  return (
    <div className="rounded-xl border border-[var(--z-border)] bg-white">
      <div className="flex items-start justify-between gap-3 border-b border-[var(--z-border)] px-4 py-3">
        <div className="min-w-0">
          <div className="text-sm font-semibold text-slate-900">
            Top 10 Feature Requests by Tickets
          </div>
          <div className="mt-0.5 text-xs text-slate-500">
            Click a bar to view related tickets
          </div>
        </div>
      </div>

      <div className="relative p-4">
        <div className="relative w-full overflow-x-auto">
          <svg
            viewBox={`0 0 ${w} ${h}`}
            className="min-w-[820px] w-full"
            role="img"
            aria-label="Feature requests bar chart"
            onMouseLeave={() => setHovered(null)}
          >
            {/* grid + y axis */}
            {yTicks.map((t) => {
              const denom = Math.max(1, yTicks[yTicks.length - 1]!);
              const yy = padT + ih - (t / denom) * ih;
              return (
                <g key={t}>
                  <line
                    x1={padL}
                    x2={w - padR}
                    y1={yy}
                    y2={yy}
                    stroke="#e5e7eb"
                    strokeDasharray="2 4"
                  />
                  <text
                    x={padL - 10}
                    y={yy + 4}
                    textAnchor="end"
                    fontSize="11"
                    fill="#64748b"
                  >
                    {t}
                  </text>
                </g>
              );
            })}

            {/* axes */}
            <line x1={padL} x2={padL} y1={padT} y2={padT + ih} stroke="#cbd5e1" />
            <line
              x1={padL}
              x2={w - padR}
              y1={padT + ih}
              y2={padT + ih}
              stroke="#cbd5e1"
            />

            <text
              x={18}
              y={padT + ih / 2}
              transform={`rotate(-90 18 ${padT + ih / 2})`}
              textAnchor="middle"
              fontSize="12"
              fill="#64748b"
            >
              Tickets
            </text>
            {/* x-axis label is rendered below as HTML for better layout */}

            {/* bars */}
            {top.map((x, idx) => {
              const slot = iw / Math.max(1, top.length);
              const barW = Math.max(18, Math.min(54, slot * 0.6));
              const cx = padL + slot * idx + slot / 2;
              const barH = Math.max(6, (x.tickets / max) * ih);
              const bx = cx - barW / 2;
              const by = padT + ih - barH;
              const selected = hovered?.title === x.title;
              return (
                <g key={x.id}>
                  <rect
                    x={bx}
                    y={by}
                    width={barW}
                    height={barH}
                    rx={8}
                    className={cn(
                      "cursor-pointer",
                      selected
                        ? "fill-[color-mix(in_srgb,var(--z-brand)_92%,white)]"
                        : "fill-[color-mix(in_srgb,var(--z-brand)_85%,white)]"
                    )}
                    onMouseEnter={() => setHovered({ title: x.title, tickets: x.tickets, x: cx, y: by })}
                    onFocus={() => setHovered({ title: x.title, tickets: x.tickets, x: cx, y: by })}
                    onClick={() => onSelect(x.id)}
                    role="button"
                    tabIndex={0}
                    aria-label={`Open feature request: ${x.title}`}
                  />
                </g>
              );
            })}
          </svg>

          {/* full x-axis labels (wrapped) */}
          <div className="min-w-[820px] w-full pb-1">
            <div
              className="-mt-1 grid items-start gap-2 text-center text-[11px] leading-snug text-slate-500"
              style={{
                paddingLeft: `${padLPct}%`,
                paddingRight: `${padRPct}%`,
                gridTemplateColumns: `repeat(${Math.max(1, top.length)}, minmax(0, 1fr))`,
              }}
            >
              {top.map((x) => (
                <div key={x.id} className="min-w-0 break-words">
                  {x.title}
                </div>
              ))}
            </div>
          </div>
        </div>

        {hovered ? (() => {
          const leftPct = (hovered.x / w) * 100;
          const topPct = (hovered.y / h) * 100;
          const flipX = leftPct > 70;
          const clampedLeft = Math.min(96, Math.max(4, leftPct));
          const clampedTop = Math.min(92, Math.max(8, topPct));
          const transform = [
            `translate(${flipX ? "-100%" : "-50%"}, -100%)`,
            `translate(${flipX ? "-8px" : "0"}, -10px)`,
          ].join(" ");

          return (
            <div
              className="pointer-events-none absolute z-10 w-[240px] rounded-lg border border-[var(--z-border)] bg-white p-3 text-xs text-slate-700 shadow-lg"
              style={{
                left: `${clampedLeft}%`,
                top: `${clampedTop}%`,
                transform,
              }}
            >
              <div className="text-[13px] font-semibold text-slate-900">{hovered.title}</div>
              <div className="mt-2">
                <span className="text-slate-500">Tickets:</span>{" "}
                <span className="font-semibold text-slate-900">{hovered.tickets}</span>
              </div>
            </div>
          );
        })() : null}
      </div>
    </div>
  );
}

function SparkBars({ values }: { values: number[] }) {
  const max = Math.max(1, ...values);
  return (
    <div className="flex items-end gap-1">
      {values.map((v, idx) => (
        <div
          key={idx}
          className="w-2 rounded-sm bg-[color-mix(in_srgb,var(--z-brand)_70%,white)]"
          style={{ height: `${Math.max(3, Math.round((v / max) * 28))}px` }}
        />
      ))}
    </div>
  );
}

type TrendDirection = "increasing" | "stable" | "decreasing";

function formatPct(value: number) {
  const pct = Math.round(value * 10) / 10;
  return `${pct}%`;
}

function trendFromShare(sharePct: number): TrendDirection {
  if (sharePct >= 14) return "increasing";
  if (sharePct <= 10.5) return "decreasing";
  return "stable";
}

function severityLabelFromPattern(p: { severity?: "low" | "medium" | "high"; evidence_ticket_ids: string[] }) {
  const evidence = p.evidence_ticket_ids.map((id) => getTicket(id)).filter(Boolean) as Ticket[];
  const hasUrgent = evidence.some((t) => t.priority === "urgent" || t.isUrgent);
  if (hasUrgent) return "Critical" as const;
  if (p.severity === "high") return "High" as const;
  if (p.severity === "medium") return "Medium" as const;
  return "Low" as const;
}

function xIndexForSeverityLabel(label: "Low" | "Medium" | "High" | "Critical") {
  return label === "Low" ? 0 : label === "Medium" ? 1 : label === "High" ? 2 : 3;
}

function trendColor(trend: TrendDirection) {
  if (trend === "increasing") return "fill-rose-500 stroke-rose-600";
  if (trend === "decreasing") return "fill-emerald-500 stroke-emerald-600";
  return "fill-blue-500 stroke-blue-600";
}

function PatternMap({
  patterns,
  selectedTitle,
  onSelect,
}: {
  patterns: PatternsResponse["patterns"];
  selectedTitle: string | null;
  onSelect: (title: string) => void;
}) {
  const padL = 54;
  const padR = 18;
  const padT = 14;
  const padB = 44;
  const w = 980;
  const h = 320;
  const iw = w - padL - padR;
  const ih = h - padT - padB;
  const maxY = Math.max(1, ...patterns.map((p) => p.count));
  const total = Math.max(1, patterns.reduce((acc, p) => acc + p.count, 0));

  const yTicks = React.useMemo(() => {
    const ticks = 4;
    const step = Math.ceil(maxY / ticks);
    return Array.from({ length: ticks + 1 }, (_, i) => i * step);
  }, [maxY]);

  const points = React.useMemo(() => {
    return patterns.map((p) => {
      const sevLabel = severityLabelFromPattern(p);
      const xi = xIndexForSeverityLabel(sevLabel);
      const sharePct = (p.count / total) * 100;
      const r = Math.max(5, Math.min(16, 5 + (sharePct / 24) * 12));
      const unclampedX = padL + (xi / 3) * iw;
      const unclampedY = padT + ih - (p.count / maxY) * ih;
      const x = Math.min(w - padR - r, Math.max(padL + r, unclampedX));
      const y = Math.min(padT + ih - r, Math.max(padT + r, unclampedY));
      const trend = trendFromShare(sharePct);
      return { p, x, y, r, sevLabel, sharePct, trend };
    });
  }, [h, ih, iw, maxY, padL, padR, padT, patterns, total, w]);

  const [hovered, setHovered] = React.useState<{
    title: string;
    x: number;
    y: number;
    count: number;
    sharePct: number;
    sevLabel: "Low" | "Medium" | "High" | "Critical";
    trend: TrendDirection;
  } | null>(null);

  return (
    <div className="rounded-xl border border-[var(--z-border)] bg-white p-4">
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="text-sm font-semibold text-slate-900">
            Pattern Map — Severity vs Volume
          </div>
          <div className="mt-1 text-xs text-slate-600">
    
          </div>
        </div>
        <button
          type="button"
          className="rounded-md border border-[var(--z-border)] bg-white px-2 py-1 text-xs text-slate-700 hover:bg-[var(--z-hover)]"
          title="Download"
          onClick={() => {
            // UI-only: placeholder (we can wire real export later)
          }}
        >
          ⭳
        </button>
      </div>

      <div className="mt-3 relative w-full">
        <div className="w-full overflow-x-auto" onMouseLeave={() => setHovered(null)}>
          <svg
            viewBox={`0 0 ${w} ${h}`}
            className="min-w-[820px] w-full"
            role="img"
            aria-label="Pattern map severity versus occurrences"
          >
            {/* grid + y axis */}
            {yTicks.map((t) => {
              const yy = padT + ih - (t / Math.max(1, yTicks[yTicks.length - 1]!)) * ih;
              return (
                <g key={t}>
                  <line
                    x1={padL}
                    x2={w - padR}
                    y1={yy}
                    y2={yy}
                    stroke="#e5e7eb"
                    strokeDasharray="2 4"
                  />
                  <text
                    x={padL - 10}
                    y={yy + 4}
                    textAnchor="end"
                    fontSize="11"
                    fill="#64748b"
                  >
                    {t}
                  </text>
                </g>
              );
            })}

            {/* x axis labels */}
            {(["Low", "Medium", "High", "Critical"] as const).map((label, idx) => {
              const xx = padL + (idx / 3) * iw;
              return (
                <text
                  key={label}
                  x={xx}
                  y={h - 18}
                  textAnchor="middle"
                  fontSize="12"
                  fill="#64748b"
                >
                  {label}
                </text>
              );
            })}

            <text
              x={18}
              y={padT + ih / 2}
              transform={`rotate(-90 18 ${padT + ih / 2})`}
              textAnchor="middle"
              fontSize="12"
              fill="#64748b"
            >
              Occurrences
            </text>
            <text
              x={padL + iw / 2}
              y={h - 4}
              textAnchor="middle"
              fontSize="12"
              fill="#64748b"
            >
              Severity
            </text>

            {/* points */}
            {points.map(({ p, x, y, r, sevLabel, sharePct, trend }) => {
              const selected = selectedTitle === p.title;
              return (
                <g key={p.title}>
                  <circle
                    cx={x}
                    cy={y}
                    r={r}
                    className={cn(
                      trendColor(trend),
                      "cursor-pointer opacity-80 hover:opacity-95"
                    )}
                    strokeWidth={selected ? 4 : 2}
                    onMouseEnter={() =>
                      setHovered({
                        title: p.title,
                        x,
                        y,
                        count: p.count,
                        sharePct,
                        sevLabel,
                        trend,
                      })
                    }
                    onFocus={() =>
                      setHovered({
                        title: p.title,
                        x,
                        y,
                        count: p.count,
                        sharePct,
                        sevLabel,
                        trend,
                      })
                    }
                    onClick={() => onSelect(p.title)}
                    role="button"
                    tabIndex={0}
                  />
                </g>
              );
            })}
          </svg>
        </div>

        {hovered ? (() => {
          const leftPct = (hovered.x / w) * 100;
          const topPct = (hovered.y / h) * 100;
          const flipX = leftPct > 70;
          const flipY = topPct > 62;
          const clampedLeft = Math.min(96, Math.max(4, leftPct));
          const clampedTop = Math.min(92, Math.max(6, topPct));
          const transform = [
            `translate(${flipX ? "-100%" : "0"}, ${flipY ? "-100%" : "0"})`,
            `translate(${flipX ? "-10px" : "10px"}, ${flipY ? "-10px" : "-10px"})`,
          ].join(" ");

          return (
            <div
              className="pointer-events-none absolute z-10 rounded-lg border border-[var(--z-border)] bg-white p-3 text-xs text-slate-700 shadow-lg"
              style={{
                left: `${clampedLeft}%`,
                top: `${clampedTop}%`,
                transform,
                width: "240px",
              }}
            >
              <div className="text-[13px] font-semibold text-slate-900">{hovered.title}</div>
              <div className="mt-2 space-y-1">
                <div>
                  <span className="text-slate-500">Count:</span> {hovered.count}
                </div>
                <div>
                  <span className="text-slate-500">Share:</span> {formatPct(hovered.sharePct)}
                </div>
                <div>
                  <span className="text-slate-500">Severity:</span> {hovered.sevLabel}
                </div>
                <div>
                  <span className="text-slate-500">Trend:</span>{" "}
                  <span
                    className={cn(
                      hovered.trend === "increasing"
                        ? "text-rose-600"
                        : hovered.trend === "decreasing"
                        ? "text-emerald-600"
                        : "text-blue-600"
                    )}
                  >
                    {hovered.trend}
                  </span>
                </div>
              </div>
              <div className="mt-2 text-[11px] text-slate-500">Click to view tickets</div>
            </div>
          );
        })() : null}
      </div>

      <div className="mt-3 flex flex-wrap items-center justify-center gap-4 text-xs text-slate-600">
        <div className="flex items-center gap-2">
          <span className="inline-block h-2.5 w-2.5 rounded-full bg-rose-500" />
          Increasing
        </div>
        <div className="flex items-center gap-2">
          <span className="inline-block h-2.5 w-2.5 rounded-full bg-blue-500" />
          Stable
        </div>
        <div className="flex items-center gap-2">
          <span className="inline-block h-2.5 w-2.5 rounded-full bg-emerald-500" />
          Decreasing
        </div>
      </div>
    </div>
  );
}

function TicketDrawer({
  open,
  title,
  subtitle,
  tickets: drawerTickets,
  onClose,
  ticketActions,
}: {
  open: boolean;
  title: string;
  subtitle?: string;
  tickets: Ticket[];
  onClose: () => void;
  ticketActions?: (t: Ticket) => React.ReactNode;
}) {
  return (
    <div
      className={cn(
        "fixed inset-0 z-50 transition",
        open ? "pointer-events-auto" : "pointer-events-none"
      )}
      aria-hidden={!open}
    >
      <div
        className={cn(
          "absolute inset-0 bg-slate-900/40 transition-opacity",
          open ? "opacity-100" : "opacity-0"
        )}
        onClick={onClose}
      />
      <aside
        className={cn(
          "absolute right-0 top-0 h-full w-[420px] max-w-[92vw] bg-white shadow-2xl transition-transform",
          open ? "translate-x-0" : "translate-x-full"
        )}
        role="dialog"
        aria-modal="true"
        aria-label="Tickets drawer"
      >
        <div className="flex h-full flex-col">
          <div className="flex items-start justify-between gap-3 border-b border-[var(--z-border)] p-4">
            <div className="min-w-0">
              <div className="text-sm font-semibold text-slate-900 break-words">{title}</div>
              {subtitle ? <div className="mt-1 text-xs text-slate-600">{subtitle}</div> : null}
              <div className="mt-2 text-xs text-slate-500">{drawerTickets.length} tickets</div>
            </div>
              <button
                type="button"
                onClick={onClose}
                className="rounded-md border border-[var(--z-border)] bg-white px-2 py-1 text-xs text-slate-700 hover:bg-[var(--z-hover)]"
                aria-label="Close"
              >
                ✕
              </button>
          </div>

          <div className="min-h-0 flex-1 overflow-auto p-4">
            <div className="space-y-3">
              {drawerTickets.map((t) => (
                <Link
                  key={t.id}
                  href={`/agent/tickets/${t.id}`}
                  className="block rounded-lg border border-[var(--z-border)] bg-white p-3 hover:bg-[var(--z-hover)]"
                >
                  <div className="flex items-center justify-between gap-3">
                    <div className="min-w-0">
                      <div className="text-[11px] text-slate-500">
                        <span className="font-semibold text-slate-700">TKT-{t.id}</span>{" "}
                        <span className="ml-2 rounded-full border border-[var(--z-border)] px-2 py-0.5 text-[10px] text-slate-700">
                          {t.status}
                        </span>
                      </div>
                      <div className="mt-1 text-sm font-semibold text-slate-900 break-words">
                        {t.subject}
                      </div>
                      <div className="mt-1 text-xs text-slate-600">
                        Category:{" "}
                        <span className="font-medium text-slate-700">
                          {t.tags?.[0] ?? "General"}
                        </span>{" "}
                        • Assignee: {t.assigneeName}
                      </div>
                      <div className="mt-2 flex flex-wrap gap-1.5">
                        {t.tags.slice(0, 3).map((tag) => (
                          <span
                            key={tag}
                            className="rounded-full border border-[var(--z-border)] bg-white px-2 py-0.5 text-[11px] text-slate-700"
                          >
                            {tag}
                          </span>
                        ))}
                      </div>
                    </div>
                      <div className="shrink-0">
                        <div className="flex flex-col items-end gap-2">
                          {ticketActions ? <div className="shrink-0">{ticketActions(t)}</div> : null}
                          <span
                            className={cn(
                              "rounded-full px-2 py-1 text-[11px] font-semibold",
                              t.priority === "urgent"
                                ? "bg-rose-100 text-rose-700"
                                : t.priority === "high"
                                ? "bg-amber-100 text-amber-800"
                                : "bg-slate-100 text-slate-700"
                            )}
                          >
                            {t.priority}
                          </span>
                        </div>
                      </div>
                  </div>
                </Link>
              ))}

              {!drawerTickets.length ? (
                <div className="rounded-md border border-[var(--z-border)] bg-slate-50 p-3 text-xs text-slate-600">
                  No tickets matched this selection.
                </div>
              ) : null}
            </div>
          </div>
        </div>
      </aside>
    </div>
  );
}

function CollapsibleSection({
  title,
  subtitle,
  right,
  children,
  defaultOpen = true,
}: {
  title: string;
  subtitle?: string;
  right?: React.ReactNode;
  children: React.ReactNode;
  defaultOpen?: boolean;
}) {
  const [open, setOpen] = React.useState(defaultOpen);
  const contentId = React.useId();
  return (
    <section className="rounded-xl border border-[var(--z-border)] bg-white">
      <button
        type="button"
        aria-expanded={open}
        aria-controls={contentId}
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-start justify-between gap-3 border-b border-[var(--z-border)] px-4 py-3 text-left hover:bg-[var(--z-hover)]"
      >
        <div className="min-w-0">
          <div className="text-sm font-semibold text-slate-900">{title}</div>
          {subtitle ? <div className="mt-0.5 text-xs text-slate-500">{subtitle}</div> : null}
        </div>
        <div className="flex shrink-0 items-center gap-2">
          {right ? <div className="shrink-0">{right}</div> : null}
          <ChevronDown
            className={cn(
              "h-4 w-4 text-slate-500 transition-transform duration-200",
              open ? "rotate-180" : "rotate-0"
            )}
          />
        </div>
      </button>

      <div
        id={contentId}
        className={cn(
          "grid transition-[grid-template-rows] duration-200",
          open ? "grid-rows-[1fr]" : "grid-rows-[0fr]"
        )}
      >
        <div className="min-h-0 overflow-hidden">
          <div className="p-4">{children}</div>
        </div>
      </div>
    </section>
  );
}

function CollapsibleCard({
  title,
  defaultOpen = true,
  children,
}: {
  title: string;
  defaultOpen?: boolean;
  children: React.ReactNode;
}) {
  const [open, setOpen] = React.useState(defaultOpen);
  const contentId = React.useId();

  return (
    <div className="overflow-hidden rounded-lg border border-[var(--z-border)] bg-white">
      <button
        type="button"
        aria-expanded={open}
        aria-controls={contentId}
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center justify-between gap-3 px-4 py-3 text-left hover:bg-[var(--z-hover)]"
      >
        <div className="text-xs font-semibold text-slate-700">{title}</div>
        <ChevronDown
          className={cn(
            "h-4 w-4 text-slate-500 transition-transform duration-200",
            open ? "rotate-180" : "rotate-0"
          )}
        />
      </button>

      <div
        id={contentId}
        className={cn(
          "grid transition-[grid-template-rows] duration-200",
          open ? "grid-rows-[1fr]" : "grid-rows-[0fr]"
        )}
      >
        <div className="min-h-0 overflow-hidden">
          <div className="px-4 pb-4">{children}</div>
        </div>
      </div>
    </div>
  );
}

export function AnalyticsDashboard() {
  const [weekly, setWeekly] = React.useState<WeeklyRollup[] | null>(null);
  const [weeklyError, setWeeklyError] = React.useState<string | null>(null);
  const [allRange, setAllRange] = React.useState<{ start: string; end: string } | null>(
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
  const [ticketPushState, setTicketPushState] = React.useState<
    Record<string, "idle" | "pushing" | "success" | "error">
  >({});

  const [drawerOpen, setDrawerOpen] = React.useState(false);
  const [drawerPatternTitle, setDrawerPatternTitle] = React.useState<string | null>(null);
  const [drawerTag, setDrawerTag] = React.useState<string | null>(null);
  const [drawerFeatureId, setDrawerFeatureId] = React.useState<string | null>(null);

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

        const times = tickets
          .map((t) => new Date(t.updatedAt).getTime())
          .filter((n) => Number.isFinite(n));
        const min = Math.min(...times);
        const max = Math.max(...times);
        if (Number.isFinite(min) && Number.isFinite(max)) {
          setAllRange({ start: toYmd(new Date(min)), end: toYmd(new Date(max)) });
        } else {
          setAllRange(null);
        }
      } catch (e) {
        if (cancelled) return;
        setWeeklyError(e instanceof Error ? e.message : "Failed to load weekly rollup");
        setWeekly(null);
        setAllRange(null);
      }
    }
    run();
    return () => {
      cancelled = true;
    };
  }, []);

  const kpi = React.useMemo(() => {
    const patternsCount = patterns?.patterns?.length ?? 0;
    const featureCount = featureRequests?.requests?.length ?? 0;
    const urgent = tickets.filter((t) => t.isUrgent || t.priority === "urgent").length;
    const recurring = tickets.filter((t) => t.isRecurring).length;
    return { patternsCount, featureCount, urgent, recurring };
  }, [featureRequests?.requests?.length, patterns?.patterns?.length]);

  React.useEffect(() => {
    if (!allRange) return;
    const { start: weekStart, end: weekEnd } = allRange;
    let cancelled = false;

    async function loadPatterns() {
      setPatternsLoading(true);
      setPatternsError(null);
      try {
        const res = await fetch("/api/analytics/patterns", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({
            weekStart,
            weekEnd,
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
            weekStart,
            weekEnd,
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
  }, [allRange]);

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

  async function pushTicketToSalesforce(ticketId: string) {
    setTicketPushState((s) => ({ ...s, [ticketId]: "pushing" }));
    try {
      const t = getTicket(ticketId);
      const res = await fetch("/api/integrations/salesforce/push-ticket", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ ticket: t, ticketId }),
      });
      if (!res.ok) throw new Error(`Push failed (${res.status})`);
      setTicketPushState((s) => ({ ...s, [ticketId]: "success" }));
      window.setTimeout(() => {
        setTicketPushState((s) => ({ ...s, [ticketId]: "idle" }));
      }, 2500);
    } catch {
      setTicketPushState((s) => ({ ...s, [ticketId]: "error" }));
      window.setTimeout(() => {
        setTicketPushState((s) => ({ ...s, [ticketId]: "idle" }));
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

  const overallTopIssues = React.useMemo(() => {
    const counts = new Map<string, { label: string; count: number }>();
    for (const t of tickets) {
      const cat = categoryFromTicket(t);
      const key = cat;
      counts.set(key, { label: cat, count: (counts.get(key)?.count ?? 0) + 1 });
    }
    return Array.from(counts.entries())
      .map(([key, v]) => ({ key, label: v.label, count: v.count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 8);
  }, []);

  const patternsTotal = React.useMemo(() => {
    return Math.max(1, patterns?.patterns?.reduce((acc, p) => acc + p.count, 0) ?? 1);
  }, [patterns?.patterns]);

  const selectedPattern = React.useMemo(() => {
    if (!drawerPatternTitle) return null;
    return patterns?.patterns?.find((p) => p.title === drawerPatternTitle) ?? null;
  }, [drawerPatternTitle, patterns?.patterns]);

  const selectedEvidenceTickets = React.useMemo(() => {
    if (!selectedPattern) return [];
    return selectedPattern.evidence_ticket_ids
      .map((id) => getTicket(id))
      .filter(Boolean) as Ticket[];
  }, [selectedPattern]);

  const drawerTickets = React.useMemo(() => {
    if (drawerFeatureId) {
      const req = featureRequests?.requests?.find((r) => r.id === drawerFeatureId) ?? null;
      return (req?.evidence_ticket_ids ?? [])
        .map((id) => getTicket(id))
        .filter(Boolean) as Ticket[];
    }
    const base = drawerPatternTitle ? selectedEvidenceTickets : tickets;
    if (!drawerTag) return base;
    return base.filter((t) => t.tags.includes(drawerTag));
  }, [
    drawerFeatureId,
    drawerPatternTitle,
    drawerTag,
    featureRequests?.requests,
    selectedEvidenceTickets,
  ]);

  const selectedFeature = React.useMemo(() => {
    if (!drawerFeatureId) return null;
    return featureRequests?.requests?.find((r) => r.id === drawerFeatureId) ?? null;
  }, [drawerFeatureId, featureRequests?.requests]);

  const selectedFeatureCategory = React.useMemo(() => {
    if (!drawerFeatureId) return null;
    return rollupCategoryFromTickets(drawerTickets);
  }, [drawerFeatureId, drawerTickets]);

  const featureRows = React.useMemo(() => {
    const reqs = featureRequests?.requests ?? [];
    return reqs
      .map((r) => {
        const ev = r.evidence_ticket_ids
          .map((id) => getTicket(id))
          .filter(Boolean) as Ticket[];
        const category = rollupCategoryFromTickets(ev);
        const priority = priorityLabelFromTickets(ev);
        const status = statusLabelFromTickets(ev);
        return {
          id: r.id,
          title: r.title,
          description: r.description,
          category,
          priority,
          status,
          tickets: ev.length,
        };
      })
      .sort((a, b) => b.tickets - a.tickets);
  }, [featureRequests?.requests]);

  const availableFeatureCategories = React.useMemo(() => {
    const s = new Set<FeatureRequestCategory>();
    for (const r of featureRows) s.add(r.category);
    const ordered = FEATURE_REQUEST_CATEGORIES.filter(
      (c) => c !== "All Categories" && c !== "Other"
    ).filter((c) => s.has(c));
    const hasOther = s.has("Other");
    return ["All Categories", ...ordered, ...(hasOther ? (["Other"] as const) : [])] as const;
  }, [featureRows]);

  const [featureCategoryFilter, setFeatureCategoryFilter] =
    React.useState<FeatureRequestCategory>("All Categories");

  React.useEffect(() => {
    setFeatureCategoryFilter((prev) => {
      const normalized = normalizeCategoryLabel(prev);
      return (availableFeatureCategories as readonly string[]).includes(normalized)
        ? normalized
        : "All Categories";
    });
  }, [availableFeatureCategories]);

  const filteredFeatureRows = React.useMemo(() => {
    if (featureCategoryFilter === "All Categories") return featureRows;
    return featureRows.filter((r) => r.category === featureCategoryFilter);
  }, [featureCategoryFilter, featureRows]);

  const patternTagsByTitle = React.useMemo(() => {
    const out = new Map<string, string[]>();
    for (const p of patterns?.patterns ?? []) {
      const ev = p.evidence_ticket_ids.map((id) => getTicket(id)).filter(Boolean) as Ticket[];
      const counts = new Map<string, number>();
      for (const t of ev) {
        for (const tag of t.tags) counts.set(tag, (counts.get(tag) ?? 0) + 1);
      }
      const ordered = Array.from(counts.entries())
        .sort((a, b) => b[1] - a[1])
        .map(([tag]) => tag)
        .slice(0, 6);
      out.set(p.title, ordered);
    }
    return out;
  }, [patterns?.patterns]);

  return (
    <div className="min-h-0 flex-1 overflow-auto p-5">
      <div>
        <div className="rounded-2xl border border-[color-mix(in_srgb,var(--z-brand)_25%,white)] bg-[linear-gradient(135deg,color-mix(in_srgb,var(--z-brand)_18%,white),white_60%)] p-5">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <div className="text-sm font-semibold tracking-tight text-slate-900">
                  Agent Analytics Overview
                </div>
                <div className="mt-1 text-xs text-slate-600">
                  Patterns and product signals extracted from support tickets.
                </div>
              </div>
            </div>

            <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-5">
              <div className="rounded-xl border border-[var(--z-border)] bg-white p-4">
                <div className="text-xs text-slate-500">Tickets analyzed</div>
                <div className="mt-2 text-2xl font-semibold text-slate-900">
                  {tickets.length}
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
                  <div className="text-xs text-slate-500">Trend (last {weeklyBars.length} weeks)</div>
                  <span className="text-[11px] text-slate-400">last {weeklyBars.length}</span>
                </div>
                <div className="mt-3">
                  <SparkBars values={weeklyBars} />
                </div>
              </div>
            </div>

            <div className="mt-5 grid grid-cols-1 gap-5">
              <CollapsibleSection
                title="Issue pattern recognition"
                subtitle={
                  allRange ? `Across all tickets (${formatWeekLabel(allRange.start, allRange.end)})` : "Across all tickets"
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

            <div className="space-y-4">
              {patterns?.patterns?.length ? (
                <PatternMap
                  patterns={patterns.patterns}
                  selectedTitle={drawerPatternTitle}
                  onSelect={(title) => {
                    setDrawerFeatureId(null);
                    setDrawerPatternTitle(title);
                    setDrawerTag(null);
                    setDrawerOpen(true);
                  }}
                />
              ) : (
                <div className="rounded-xl border border-[var(--z-border)] bg-white p-4">
                  <div className="text-sm font-semibold text-slate-900">
                    Pattern Map — Severity vs Volume
                  </div>
                  <div className="mt-2 rounded-md border border-[var(--z-border)] bg-slate-50 p-3 text-xs text-slate-600">
                    {patternsLoading ? "Analyzing tickets…" : "No patterns found for this week."}
                  </div>
                </div>
              )}

              <div className="rounded-lg border border-[var(--z-border)] bg-white p-4">
                <div className="text-xs font-semibold text-slate-700">
                  Top issue categories
                </div>
                <div className="mt-3 space-y-2">
                  {overallTopIssues.length ? (
                    overallTopIssues.slice(0, 6).map((c) => (
                      <div key={c.key} className="flex items-center justify-between gap-3">
                        <div className="min-w-0 text-sm text-slate-700">
                          <span className="break-words leading-5">{c.label}</span>
                        </div>
                        <div className="shrink-0 text-xs text-slate-600">
                          <span className="font-semibold text-slate-900">
                            {c.count}
                          </span>
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

              <CollapsibleCard title="Identified clusters of recurring problems" defaultOpen>
                <div className="space-y-3">
                  {patterns?.patterns?.length ? (
                    patterns.patterns.map((p) => {
                      const share = (p.count / patternsTotal) * 100;
                      const sevLabel = severityLabelFromPattern(p);
                      const trend = trendFromShare(share);
                      const tagsForPattern = patternTagsByTitle.get(p.title) ?? [];
                      return (
                        <div
                          key={p.title}
                          className="rounded-lg border border-[var(--z-border)] bg-white p-4"
                        >
                          <div className="flex items-start justify-between gap-3">
                            <div className="min-w-0">
                              <div className="text-sm font-semibold leading-5 text-slate-900">
                                {p.title}
                              </div>
                              <div className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-slate-600">
                                <span>
                                  <span className="font-semibold text-slate-900">{p.count}</span>{" "}
                                  tickets
                                </span>
                                <span>{formatPct(share)} of total</span>
                                <span aria-hidden="true">—</span>
                                <span
                                  className={cn(
                                    "font-medium",
                                    trend === "increasing"
                                      ? "text-rose-600"
                                      : trend === "decreasing"
                                      ? "text-emerald-600"
                                      : "text-slate-500"
                                  )}
                                >
                                  {trend === "increasing"
                                    ? "Increasing"
                                    : trend === "decreasing"
                                    ? "Decreasing"
                                    : "Stable"}
                                </span>
                              </div>
                            </div>
                            <div className="flex shrink-0 items-center gap-2">
                              <span
                                className={cn(
                                  "rounded-full px-2 py-1 text-[11px] font-semibold",
                                  sevLabel === "Critical"
                                    ? "bg-rose-100 text-rose-700"
                                    : sevLabel === "High"
                                    ? "bg-amber-100 text-amber-800"
                                    : sevLabel === "Medium"
                                    ? "bg-blue-100 text-blue-700"
                                    : "bg-slate-100 text-slate-700"
                                )}
                              >
                                {sevLabel}
                              </span>
                              <button
                                type="button"
                                className="text-xs text-slate-600 hover:text-slate-900"
                                onClick={() => {
                                  setDrawerFeatureId(null);
                                  setDrawerPatternTitle(p.title);
                                  setDrawerTag(null);
                                  setDrawerOpen(true);
                                }}
                              >
                                View tickets →
                              </button>
                            </div>
                          </div>

                          {tagsForPattern.length ? (
                            <div className="mt-3 flex flex-wrap gap-2">
                              {tagsForPattern.map((tag) => (
                                <button
                                  key={tag}
                                  type="button"
                                  className="rounded-full border border-[var(--z-border)] bg-white px-3 py-1 text-xs text-slate-700 hover:bg-[var(--z-hover)]"
                                  onClick={() => {
                                    setDrawerFeatureId(null);
                                    setDrawerPatternTitle(p.title);
                                    setDrawerTag(tag);
                                    setDrawerOpen(true);
                                  }}
                                >
                                  {tag}
                                </button>
                              ))}
                            </div>
                          ) : null}
                        </div>
                      );
                    })
                  ) : (
                    <div className="rounded-md border border-[var(--z-border)] bg-slate-50 p-2 text-xs text-slate-600">
                      {patternsLoading ? "Analyzing tickets…" : "No patterns found."}
                    </div>
                  )}
                </div>
              </CollapsibleCard>
            </div>
              </CollapsibleSection>

            <CollapsibleSection
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

            <div className="space-y-4">
              {featureRequests?.requests?.length ? (
                <>
                  <FeatureRequestsBarChart
                    items={featureRows.map((r) => ({
                      id: r.id,
                      title: r.title,
                      tickets: r.tickets,
                    }))}
                    onSelect={(id) => {
                      setDrawerPatternTitle(null);
                      setDrawerTag(null);
                      setDrawerFeatureId(id);
                      setDrawerOpen(true);
                    }}
                  />

                  <div className="rounded-xl border border-[var(--z-border)] bg-white">
                    <div className="flex items-start justify-between gap-3 border-b border-[var(--z-border)] px-4 py-3">
                      <div className="min-w-0">
                        <div className="text-sm font-semibold text-slate-900">
                          All Feature Requests
                        </div>
                      </div>
                      <div className="shrink-0">
                        <select
                          value={featureCategoryFilter}
                          onChange={(e) =>
                            setFeatureCategoryFilter(normalizeCategoryLabel(e.target.value))
                          }
                          className="h-8 rounded-md border border-[var(--z-border)] bg-white px-3 text-xs text-slate-700 shadow-sm focus:outline-none focus:ring-2 focus:ring-[color-mix(in_srgb,var(--z-brand)_35%,white)]"
                          aria-label="Filter by category"
                        >
                          {(availableFeatureCategories as readonly string[]).map((c) => (
                            <option key={c} value={c}>
                              {c}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>

                    <div className="px-4 pb-4 pt-2">
                      <div className="grid grid-cols-[minmax(0,1fr)_120px_92px_92px_90px] gap-3 border-b border-[var(--z-border)] py-2 text-[11px] font-semibold text-slate-500">
                        <div>Feature Request</div>
                        <div className="text-right">Category</div>
                        <div className="text-right">Priority</div>
                        <div className="text-right">Status</div>
                        <div className="text-right">Tickets</div>
                      </div>

                      <div className="divide-y divide-[var(--z-border)]">
                        {filteredFeatureRows.map((r) => {
                          return (
                            <div
                              key={r.id}
                              className="grid grid-cols-[minmax(0,1fr)_120px_92px_92px_90px] gap-3 py-3"
                            >
                              <button
                                type="button"
                                className="min-w-0 text-left"
                                onClick={() => {
                                  setDrawerPatternTitle(null);
                                  setDrawerTag(null);
                                  setDrawerFeatureId(r.id);
                                  setDrawerOpen(true);
                                }}
                              >
                                <div className="text-sm font-semibold leading-5 text-slate-900">
                                  {r.title}
                                </div>
                                <div className="mt-0.5 line-clamp-1 text-xs text-slate-500">
                                  {r.description}
                                </div>
                              </button>

                              <div className="flex items-center justify-end">
                                <span className="rounded-full border border-[var(--z-border)] bg-white px-2 py-0.5 text-[11px] text-slate-700">
                                  {r.category}
                                </span>
                              </div>

                              <div className="flex items-center justify-end">
                                <span
                                  className={cn(
                                    "rounded-full px-2 py-0.5 text-[11px] font-semibold",
                                    r.priority === "Critical"
                                      ? "bg-rose-100 text-rose-700"
                                      : r.priority === "High"
                                      ? "bg-amber-100 text-amber-800"
                                      : r.priority === "Medium"
                                      ? "bg-slate-100 text-slate-700"
                                      : "bg-slate-50 text-slate-600"
                                  )}
                                >
                                  {r.priority}
                                </span>
                              </div>

                              <div className="flex items-center justify-end">
                                <span
                                  className={cn(
                                    "rounded-full px-2 py-0.5 text-[11px] font-semibold",
                                    r.status === "resolved"
                                      ? "bg-emerald-100 text-emerald-700"
                                      : "bg-amber-100 text-amber-800"
                                  )}
                                >
                                  {r.status}
                                </span>
                              </div>

                              <div className="flex items-center justify-end gap-2">
                                <span className="text-sm font-semibold text-slate-900">
                                  {r.tickets}
                                </span>
                              </div>
                            </div>
                          );
                        })}

                        {!filteredFeatureRows.length ? (
                          <div className="rounded-md border border-[var(--z-border)] bg-slate-50 p-3 text-xs text-slate-600">
                            No feature requests matched this category.
                          </div>
                        ) : null}
                      </div>
                    </div>
                  </div>
                </>
              ) : (
                <div className="rounded-md border border-[var(--z-border)] bg-slate-50 p-2 text-xs text-slate-600">
                  {featureLoading
                    ? "Extracting feature requests…"
                    : "No feature requests found."}
                </div>
              )}
            </div>
            </CollapsibleSection>
        </div>
      </div>
      </div>

      <TicketDrawer
        open={drawerOpen}
        title={
          drawerFeatureId ? selectedFeature?.title ?? "Feature request" : drawerPatternTitle ?? "All tickets"
        }
        subtitle={
          drawerFeatureId
            ? selectedFeatureCategory
              ? `Feature request • ${selectedFeatureCategory}`
              : "Feature request"
            : drawerPatternTitle
            ? drawerTag
              ? `Filtered by tag: ${drawerTag}`
              : "Evidence tickets for this cluster"
            : undefined
        }
        tickets={drawerTickets}
        ticketActions={(t) => {
          const state = ticketPushState[t.id] ?? "idle";
          return (
            <Button
              variant="primary"
              size="sm"
              disabled={state === "pushing"}
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                pushTicketToSalesforce(t.id);
              }}
            >
              {state === "pushing" ? "Pushing…" : state === "success" ? "Pushed" : "Push"}
            </Button>
          );
        }}
        onClose={() => {
          setDrawerOpen(false);
          setDrawerPatternTitle(null);
          setDrawerTag(null);
          setDrawerFeatureId(null);
        }}
      />
    </div>
  );
}


