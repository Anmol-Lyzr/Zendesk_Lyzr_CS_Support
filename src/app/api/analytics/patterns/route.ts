import { NextResponse } from "next/server";
import { tickets, type Ticket } from "@/lib/mockTickets";
import { endOfLocalDayFromYmd, startOfLocalDayFromYmd } from "@/lib/dates";

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

function stripCodeFences(s: string) {
  const trimmed = s.trim();
  if (trimmed.startsWith("```")) {
    return trimmed.replace(/^```[a-zA-Z0-9_-]*\n?/, "").replace(/\n?```$/, "").trim();
  }
  return trimmed;
}

function safeJsonParse<T>(s: string): { ok: true; value: T } | { ok: false; error: string } {
  try {
    const start = s.indexOf("{");
    const end = s.lastIndexOf("}");
    const candidate = start >= 0 && end > start ? s.slice(start, end + 1) : s;
    return { ok: true, value: JSON.parse(candidate) as T };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : String(e) };
  }
}

function escapeControlCharsInsideStrings(input: string) {
  let out = "";
  let inString = false;
  let escaped = false;
  for (let i = 0; i < input.length; i++) {
    const ch = input[i]!;
    if (!inString) {
      if (ch === "\"") inString = true;
      out += ch;
      continue;
    }
    if (escaped) {
      out += ch;
      escaped = false;
      continue;
    }
    if (ch === "\\") {
      out += ch;
      escaped = true;
      continue;
    }
    if (ch === "\"") {
      out += ch;
      inString = false;
      continue;
    }
    if (ch === "\n") out += "\\n";
    else if (ch === "\r") out += "\\r";
    else if (ch === "\t") out += "\\t";
    else out += ch;
  }
  return out;
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
  if (t.similarityGroup === "A") return { key: "workflow_studio", label: "Workflow Studio" };
  if (t.similarityGroup === "B") return { key: "kb_rag", label: "KB / RAG" };
  if (t.similarityGroup === "C") return { key: "tools", label: "Tools & integrations" };
  return { key: "other", label: "Other" };
}

function recommendedActionsForKey(key: string): string[] {
  switch (key) {
    case "login_auth":
      return [
        "Review auth error telemetry and top failure codes for this week.",
        "Add/refresh a troubleshooting KB article for common login failures.",
        "Improve UX copy for login errors and guide users to recovery flows.",
      ];
    case "workflow_studio":
      return [
        "Investigate workflow execution errors (timeouts, invalid configs) and correlate with recent releases.",
        "Add guardrails: config validation on import + clear remediation steps.",
        "Tune timeouts/retries and surface latency diagnostics in execution logs.",
      ];
    case "kb_rag":
      return [
        "Validate ingestion coverage (crawl scope, parsing quality) and list indexed docs/chunks.",
        "Tune chunking/overlap and test retrieval with unique-phrase queries.",
        "Add monitoring for stale index or mismatched KB/RAG IDs across operations.",
      ];
    case "tools":
      return [
        "Audit recent tool/schema changes and impacted workflows (operationId/tool rename).",
        "Provide a bulk-migration path (export/patch/import) with validation.",
        "Add compatibility checks to prevent breaking changes at runtime.",
      ];
    case "reliability":
      return [
        "Implement/confirm exponential backoff with jitter for rate limits and transient failures.",
        "Check WebSocket keep-alives / reconnect behavior and proxy timeouts.",
        "Add run-history fallback to reduce impact of streaming interruptions.",
      ];
    default:
      return [
        "Cluster tickets by topic and confirm the top driver with representative examples.",
        "Create a KB article or internal runbook for the leading issue type.",
        "Add a product signal/telemetry check to validate root cause quickly.",
      ];
  }
}

function severityForTickets(group: Ticket[]): "low" | "medium" | "high" {
  const urgent = group.filter((t) => t.isUrgent || t.priority === "urgent").length;
  const recurring = group.filter((t) => t.isRecurring).length;
  if (urgent >= 2 || recurring >= Math.max(2, Math.ceil(group.length * 0.6))) return "high";
  if (urgent >= 1 || recurring >= 1) return "medium";
  return "low";
}

function withinRange(t: Ticket, start: Date, end: Date) {
  const updated = new Date(t.updatedAt).getTime();
  return updated >= start.getTime() && updated <= end.getTime();
}

async function tryLyzrPatterns(input: {
  weekStart: string;
  weekEnd: string;
  tickets: Ticket[];
}): Promise<PatternsResponse | null> {
  const apiKey = process.env.LYZR_API_KEY;
  const agentId = process.env.LYZR_AGENT_ID;
  const userId = process.env.LYZR_USER_ID;
  const baseUrl = process.env.LYZR_INFERENCE_BASE_URL ?? "https://agent-prod.studio.lyzr.ai";

  if (!apiKey || !agentId || !userId) return null;

  const sessionId = `${agentId}-analytics-patterns-${input.weekStart}`;

  const messagePayload = {
    task: "Analyze support tickets for weekly issue pattern recognition and output actionable insights.",
    output_schema: {
      weekStart: "string (YYYY-MM-DD)",
      weekEnd: "string (YYYY-MM-DD)",
      patterns: [
        {
          title: "string (short, descriptive)",
          count: "number",
          evidence_ticket_ids: "string[] (ticket ids)",
          recommended_actions: "string[] (2-4 actions)",
          severity: "\"low\" | \"medium\" | \"high\" (optional)",
        },
      ],
    },
    rules: [
      "Return ONLY valid JSON matching output_schema. No markdown, no extra keys.",
      "Patterns must be actionable and grounded in the provided tickets.",
      "Prefer grouping by recurring themes and mention the most representative ticket ids as evidence.",
    ],
    weekStart: input.weekStart,
    weekEnd: input.weekEnd,
    tickets: input.tickets.map((t) => ({
      id: t.id,
      subject: t.subject,
      tags: t.tags,
      similarityGroup: t.similarityGroup,
      isRecurring: t.isRecurring,
      isUrgent: t.isUrgent,
      issueReported: t.lyzr.issueReported,
      lastCustomerMessage:
        t.conversation.find((m) => m.authorType === "customer")?.body ?? "",
    })),
  };

  const res = await fetch(`${baseUrl}/v3/inference/chat/`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": apiKey,
    },
    body: JSON.stringify({
      user_id: userId,
      agent_id: agentId,
      session_id: sessionId,
      message: JSON.stringify(messagePayload),
    }),
  });

  const raw = await res.text();
  if (!res.ok) return null;

  const wrapper = safeJsonParse<unknown>(raw);
  let candidate: string | null = null;
  if (wrapper.ok && wrapper.value && typeof wrapper.value === "object") {
    const w = wrapper.value as Record<string, unknown>;
    candidate =
      (typeof w.response === "string" && w.response) ||
      (typeof w.message === "string" && w.message) ||
      (typeof w.output === "string" && w.output) ||
      null;
  }
  const jsonString = stripCodeFences(candidate ?? raw);
  const parsed = safeJsonParse<PatternsResponse>(escapeControlCharsInsideStrings(jsonString));
  if (!parsed.ok) return null;

  const v = parsed.value as Partial<PatternsResponse> & Record<string, unknown>;
  if (
    typeof v.weekStart !== "string" ||
    typeof v.weekEnd !== "string" ||
    !Array.isArray(v.patterns)
  ) {
    return null;
  }

  const normalized: PatternsResponse = {
    weekStart: v.weekStart,
    weekEnd: v.weekEnd,
    patterns: (v.patterns as unknown[])
      .map((p) => (typeof p === "object" && p ? (p as Record<string, unknown>) : null))
      .filter(Boolean)
      .map((p) => ({
        title: typeof p!.title === "string" ? p!.title : "Pattern",
        count: typeof p!.count === "number" ? p!.count : 0,
        evidence_ticket_ids: Array.isArray(p!.evidence_ticket_ids)
          ? (p!.evidence_ticket_ids as unknown[]).filter((x): x is string => typeof x === "string")
          : [],
        recommended_actions: Array.isArray(p!.recommended_actions)
          ? (p!.recommended_actions as unknown[]).filter((x): x is string => typeof x === "string")
          : [],
        severity:
          p!.severity === "low" || p!.severity === "medium" || p!.severity === "high"
            ? (p!.severity as "low" | "medium" | "high")
            : undefined,
      }))
      .filter((p) => p.title && p.count > 0),
  };

  return normalized;
}

export async function POST(req: Request) {
  const body = (await req.json().catch(() => null)) as
    | { weekStart?: string; weekEnd?: string }
    | null;

  const weekStart = body?.weekStart;
  const weekEnd = body?.weekEnd;
  if (!weekStart || !weekEnd) {
    return NextResponse.json({ error: "Missing weekStart/weekEnd" }, { status: 400 });
  }

  const start = startOfLocalDayFromYmd(weekStart);
  const end = endOfLocalDayFromYmd(weekEnd);
  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) {
    return NextResponse.json({ error: "Invalid date range" }, { status: 400 });
  }

  const scoped = tickets.filter((t) => withinRange(t, start, end));

  // Prefer Lyzr-assisted analysis when configured; fallback to deterministic patterns otherwise.
  const lyzr = await tryLyzrPatterns({ weekStart, weekEnd, tickets: scoped });
  if (lyzr) return NextResponse.json(lyzr);

  const grouped = new Map<string, { label: string; tickets: Ticket[] }>();
  for (const t of scoped) {
    const cat = classifyIssue(t);
    const entry = grouped.get(cat.key) ?? { label: cat.label, tickets: [] };
    entry.tickets.push(t);
    grouped.set(cat.key, entry);
  }

  const patterns = Array.from(grouped.entries())
    .map(([key, v]) => {
      const ids = v.tickets
        .slice()
        .sort((a, b) => (a.updatedAt < b.updatedAt ? 1 : -1))
        .map((t) => t.id);
      return {
        title: `${v.label}: ${key === "workflow_studio" ? "execution issues" : "recurring topics"}`,
        count: v.tickets.length,
        evidence_ticket_ids: ids.slice(0, 5),
        recommended_actions: recommendedActionsForKey(key),
        severity: severityForTickets(v.tickets),
      };
    })
    .sort((a, b) => b.count - a.count)
    .slice(0, 10);

  const response: PatternsResponse = { weekStart, weekEnd, patterns };
  return NextResponse.json(response);
}

