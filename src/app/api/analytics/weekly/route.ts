import { NextResponse } from "next/server";
import { tickets, type Ticket } from "@/lib/mockTickets";

function toYmd(d: Date) {
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

function startOfIsoWeek(d: Date) {
  const date = new Date(d);
  const day = date.getDay(); // 0=Sun..6=Sat
  const diff = (day === 0 ? -6 : 1) - day; // move to Monday
  date.setDate(date.getDate() + diff);
  date.setHours(0, 0, 0, 0);
  return date;
}

function endOfIsoWeek(start: Date) {
  const d = new Date(start);
  d.setDate(d.getDate() + 6);
  d.setHours(23, 59, 59, 999);
  return d;
}

function classifyIssue(t: Ticket) {
  const text = `${t.subject} ${t.tags.join(" ")} ${t.lyzr.issueReported}`.toLowerCase();
  if (
    /login|sign[\s-]?in|signin|auth|password|otp|mfa|2fa|sso|credential/.test(text)
  ) {
    return { key: "login_auth", label: "Login & auth" };
  }
  if (/billing|invoice|payment|refund|charge/.test(text)) {
    return { key: "billing", label: "Billing & payments" };
  }
  if (/websocket|network|timeout|latency|rate_limit|429/.test(text)) {
    return { key: "reliability", label: "Reliability & performance" };
  }
  if (t.similarityGroup === "A") {
    return { key: "workflow_studio", label: "Workflow Studio" };
  }
  if (t.similarityGroup === "B") {
    return { key: "kb_rag", label: "KB / RAG" };
  }
  if (t.similarityGroup === "C") {
    return { key: "tools", label: "Tools & integrations" };
  }
  return { key: "other", label: "Other" };
}

type WeekBucket = {
  weekStart: string;
  weekEnd: string;
  totals: {
    tickets: number;
    open: number;
    solved: number;
    urgent: number;
    recurring: number;
  };
  topIssues: Array<{
    key: string;
    label: string;
    count: number;
    delta?: number;
  }>;
  _issueCounts: Record<string, { label: string; count: number }>;
};

export async function GET() {
  // Compute last 8 ISO weeks present in the dataset (descending).
  const ticketDates = tickets.map((t) => new Date(t.createdAt));
  const latest = ticketDates.reduce(
    (acc, d) => (d > acc ? d : acc),
    new Date(0)
  );
  const latestWeekStart = startOfIsoWeek(latest);

  const weeks: WeekBucket[] = [];
  for (let i = 0; i < 8; i++) {
    const start = new Date(latestWeekStart);
    start.setDate(start.getDate() - i * 7);
    const end = endOfIsoWeek(start);
    weeks.push({
      weekStart: toYmd(start),
      weekEnd: toYmd(end),
      totals: { tickets: 0, open: 0, solved: 0, urgent: 0, recurring: 0 },
      topIssues: [],
      _issueCounts: {},
    });
  }

  const byWeekStart = new Map(weeks.map((w) => [w.weekStart, w]));
  for (const t of tickets) {
    const created = new Date(t.createdAt);
    const ws = toYmd(startOfIsoWeek(created));
    const bucket = byWeekStart.get(ws);
    if (!bucket) continue;

    bucket.totals.tickets += 1;
    if (t.status === "solved") bucket.totals.solved += 1;
    else bucket.totals.open += 1;
    if (t.isUrgent || t.priority === "urgent") bucket.totals.urgent += 1;
    if (t.isRecurring) bucket.totals.recurring += 1;

    const cat = classifyIssue(t);
    bucket._issueCounts[cat.key] ??= { label: cat.label, count: 0 };
    bucket._issueCounts[cat.key].count += 1;
  }

  // Top issues + deltas vs previous week.
  for (let i = 0; i < weeks.length; i++) {
    const w = weeks[i];
    const prev = weeks[i + 1];
    const entries = Object.entries(w._issueCounts).map(([key, v]) => {
      const prevCount = prev?._issueCounts?.[key]?.count ?? 0;
      return {
        key,
        label: v.label,
        count: v.count,
        delta: v.count - prevCount,
      };
    });
    entries.sort((a, b) => b.count - a.count);
    w.topIssues = entries.slice(0, 8);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    delete (w as any)._issueCounts;
  }

  return NextResponse.json({ weeks });
}

