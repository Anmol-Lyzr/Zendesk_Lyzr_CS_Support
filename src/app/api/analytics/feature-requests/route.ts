import { NextResponse } from "next/server";
import { tickets, type Ticket } from "@/lib/mockTickets";

type FeatureRequestsResponse = {
  weekStart: string;
  weekEnd: string;
  requests: Array<{
    id: string;
    title: string;
    description: string;
    theme: string;
    impact: string;
    confidence: number; // 0..1
    evidence_ticket_ids: string[];
    pushed_to_salesforce?: boolean;
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

function withinRange(t: Ticket, start: Date, end: Date) {
  const created = new Date(t.createdAt).getTime();
  return created >= start.getTime() && created <= end.getTime();
}

function extractText(t: Ticket) {
  const convo = t.conversation
    .filter((m) => m.visibility === "public")
    .map((m) => `${m.authorType.toUpperCase()}: ${m.body}`)
    .join("\n\n");
  return `Subject: ${t.subject}\nTags: ${t.tags.join(", ")}\nIssue: ${t.lyzr.issueReported}\n\nConversation:\n${convo}`.trim();
}

function heuristicFeatureSignal(text: string) {
  const t = text.toLowerCase();
  const strong =
    /feature request|request(?:ing)? a feature|would like(?: to)?|please add|can you add/.test(t);
  const medium =
    /is there a way to|is it possible to|support .*?\?|bulk|alias|portable|export/.test(t);
  return strong ? 0.85 : medium ? 0.65 : 0;
}

function themeFromText(text: string) {
  const t = text.toLowerCase();
  if (/bulk|update all|multiple workflows|mass/.test(t)) return "Bulk operations";
  if (/alias|rename/.test(t)) return "Compatibility & migrations";
  if (/export|import|portable/.test(t)) return "Portability & sharing";
  if (/timeout|latency|rate_limit|reliab|websocket/.test(t)) return "Reliability & performance";
  if (/kb|rag|retrieve|chunk/.test(t)) return "Knowledge base / RAG";
  return "Product improvements";
}

function impactFromText(text: string) {
  const t = text.toLowerCase();
  if (/urgent|block|impossible|multiple times a day|production/.test(t)) return "High";
  if (/often|frequent|recurring/.test(t)) return "Medium";
  return "Low";
}

async function tryLyzrFeatureRequests(input: {
  weekStart: string;
  weekEnd: string;
  tickets: Ticket[];
}): Promise<FeatureRequestsResponse | null> {
  const apiKey = process.env.LYZR_API_KEY;
  const agentId = process.env.LYZR_AGENT_ID;
  const userId = process.env.LYZR_USER_ID;
  const baseUrl = process.env.LYZR_INFERENCE_BASE_URL ?? "https://agent-prod.studio.lyzr.ai";
  if (!apiKey || !agentId || !userId) return null;

  const sessionId = `${agentId}-analytics-feature-requests-${input.weekStart}`;
  const messagePayload = {
    task: "Extract product feature requests from support tickets and output a concise list suitable for pushing to CRM systems.",
    output_schema: {
      weekStart: "string (YYYY-MM-DD)",
      weekEnd: "string (YYYY-MM-DD)",
      requests: [
        {
          id: "string",
          title: "string",
          description: "string (1-3 sentences)",
          theme: "string",
          impact: "string (Low|Medium|High)",
          confidence: "number (0..1)",
          evidence_ticket_ids: "string[]",
        },
      ],
    },
    rules: [
      "Return ONLY valid JSON matching output_schema. No markdown, no extra keys.",
      "Only include items that are genuine product improvements or feature asks (not just bug reports).",
      "Each request must cite evidence_ticket_ids from the provided tickets.",
    ],
    weekStart: input.weekStart,
    weekEnd: input.weekEnd,
    tickets: input.tickets.map((t) => ({
      id: t.id,
      subject: t.subject,
      tags: t.tags,
      issueReported: t.lyzr.issueReported,
      customerAsks: t.conversation
        .filter((m) => m.authorType === "customer" && m.visibility === "public")
        .map((m) => m.body)
        .join("\n\n"),
    })),
  };

  const res = await fetch(`${baseUrl}/v3/inference/chat/`, {
    method: "POST",
    headers: { "Content-Type": "application/json", "x-api-key": apiKey },
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
  const parsed = safeJsonParse<FeatureRequestsResponse>(
    escapeControlCharsInsideStrings(jsonString)
  );
  if (!parsed.ok) return null;

  const v = parsed.value as Partial<FeatureRequestsResponse> & Record<string, unknown>;
  if (
    typeof v.weekStart !== "string" ||
    typeof v.weekEnd !== "string" ||
    !Array.isArray(v.requests)
  ) {
    return null;
  }

  const normalized: FeatureRequestsResponse = {
    weekStart: v.weekStart,
    weekEnd: v.weekEnd,
    requests: (v.requests as unknown[])
      .map((r) => (typeof r === "object" && r ? (r as Record<string, unknown>) : null))
      .filter(Boolean)
      .map((r, idx) => ({
        id: typeof r!.id === "string" && r!.id ? r!.id : `${v.weekStart}-${idx + 1}`,
        title: typeof r!.title === "string" ? r!.title : "Feature request",
        description: typeof r!.description === "string" ? r!.description : "",
        theme: typeof r!.theme === "string" ? r!.theme : "Product improvements",
        impact: typeof r!.impact === "string" ? r!.impact : "Medium",
        confidence: typeof r!.confidence === "number" ? r!.confidence : 0.6,
        evidence_ticket_ids: Array.isArray(r!.evidence_ticket_ids)
          ? (r!.evidence_ticket_ids as unknown[]).filter((x): x is string => typeof x === "string")
          : [],
      }))
      .filter((r) => r.title && r.evidence_ticket_ids.length),
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

  const start = new Date(`${weekStart}T00:00:00.000Z`);
  const end = new Date(`${weekEnd}T23:59:59.999Z`);
  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) {
    return NextResponse.json({ error: "Invalid date range" }, { status: 400 });
  }

  const scoped = tickets.filter((t) => withinRange(t, start, end));

  const lyzr = await tryLyzrFeatureRequests({ weekStart, weekEnd, tickets: scoped });
  if (lyzr) return NextResponse.json(lyzr);

  // Heuristic fallback: detect feature-ish asks and turn them into request cards.
  const candidates = scoped
    .map((t) => {
      const text = extractText(t);
      const confidence = heuristicFeatureSignal(text);
      return { t, text, confidence };
    })
    .filter((c) => c.confidence > 0)
    .sort((a, b) => b.confidence - a.confidence);

  const requests: FeatureRequestsResponse["requests"] = candidates.slice(0, 8).map((c, idx) => {
    const theme = themeFromText(c.text);
    const impact = impactFromText(c.text);

    const title =
      c.t.subject.length > 72 ? `${c.t.subject.slice(0, 69)}…` : c.t.subject;

    const description =
      c.t.conversation.find((m) => m.authorType === "customer" && m.visibility === "public")
        ?.body?.split("\n")
        .slice(0, 3)
        .join(" ")
        .slice(0, 260) ?? c.t.lyzr.issueReported;

    return {
      id: `${weekStart}-${idx + 1}`,
      title,
      description,
      theme,
      impact,
      confidence: c.confidence,
      evidence_ticket_ids: [c.t.id],
    };
  });

  const response: FeatureRequestsResponse = { weekStart, weekEnd, requests };
  return NextResponse.json(response);
}

