import { NextResponse } from "next/server";
import { getTicket } from "@/lib/mockTickets";
import { kbCorpus } from "@/lib/kbCorpus";

type KbArticleRecommendation = {
  id: string;
  title: string;
  url: string;
  why_relevant: string;
  confidence: number; // 0..1
};

type TicketInsights = {
  summary: string;
  issue_reported: string;
  next_steps: string[];
  draft_response: string;
  kb_articles: KbArticleRecommendation[];
};

type LyzrChatResponseWrapper =
  | {
      response?: string;
      message?: string;
      output?: string;
      // allow unknown keys
      [k: string]: unknown;
    }
  | unknown;

function stripCodeFences(s: string) {
  const trimmed = s.trim();
  if (trimmed.startsWith("```")) {
    return trimmed.replace(/^```[a-zA-Z0-9_-]*\n?/, "").replace(/\n?```$/, "").trim();
  }
  return trimmed;
}

function safeJsonParse<T>(s: string): { ok: true; value: T } | { ok: false; error: string } {
  try {
    // Some agents prepend text; attempt to locate the first '{' and last '}'.
    const start = s.indexOf("{");
    const end = s.lastIndexOf("}");
    const candidate = start >= 0 && end > start ? s.slice(start, end + 1) : s;
    return { ok: true, value: JSON.parse(candidate) as T };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : String(e) };
  }
}

function escapeControlCharsInsideStrings(input: string) {
  // Escapes literal newlines/tabs/carriage returns that appear *inside* JSON strings,
  // so that slightly-invalid "JSON-ish" agent output becomes parseable.
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

    // inString
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

    // Escape control chars inside string literal
    if (ch === "\n") {
      out += "\\n";
    } else if (ch === "\r") {
      out += "\\r";
    } else if (ch === "\t") {
      out += "\\t";
    } else {
      out += ch;
    }
  }
  return out;
}

function coerceToInsightsJsonString(raw: string): { ok: true; jsonString: string } | { ok: false; error: string } {
  // Case 1: API already returns the JSON object as the whole body (no wrapper)
  const direct = safeJsonParse<unknown>(stripCodeFences(raw));
  if (direct.ok && direct.value && typeof direct.value === "object") {
    const o = direct.value as Record<string, unknown>;
    if (
      typeof o.summary === "string" &&
      typeof o.issue_reported === "string" &&
      Array.isArray(o.next_steps) &&
      typeof o.draft_response === "string"
    ) {
      return { ok: true, jsonString: JSON.stringify(o) };
    }
  }

  // Case 2: API returns a wrapper like {"response":"```json ...```"}
  const wrapper = safeJsonParse<LyzrChatResponseWrapper>(raw);
  if (wrapper.ok && wrapper.value && typeof wrapper.value === "object") {
    const w = wrapper.value as Record<string, unknown>;
    const candidate =
      (typeof w.response === "string" && w.response) ||
      (typeof w.message === "string" && w.message) ||
      (typeof w.output === "string" && w.output) ||
      null;
    if (candidate) {
      return { ok: true, jsonString: stripCodeFences(candidate) };
    }
  }

  return { ok: false, error: direct.ok ? "Unexpected response format" : direct.error };
}

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ ticketId: string }> }
) {
  const { ticketId } = await params;
  const ticket = getTicket(ticketId);
  if (!ticket) return NextResponse.json({ error: "Ticket not found" }, { status: 404 });

  const apiKey = process.env.LYZR_API_KEY;
  const agentId = process.env.LYZR_AGENT_ID;
  const userId = process.env.LYZR_USER_ID;
  const baseUrl = process.env.LYZR_INFERENCE_BASE_URL ?? "https://agent-prod.studio.lyzr.ai";

  if (!apiKey || !agentId || !userId) {
    return NextResponse.json(
      {
        error: "Missing server configuration",
        missing: {
          LYZR_API_KEY: !apiKey,
          LYZR_AGENT_ID: !agentId,
          LYZR_USER_ID: !userId,
        },
      },
      { status: 500 }
    );
  }

  const sessionId = `${agentId}-${ticketId}`;

  const messagePayload = {
    task: "Generate support copilot outputs for this ticket.",
    output_schema: {
      summary: "string (2-4 sentences)",
      issue_reported: "string (1 sentence)",
      next_steps: "string[] (3-5 items)",
      draft_response: "string (customer-ready response)",
      kb_articles: [
        {
          id: "string (must match an id in kb_corpus)",
          title: "string",
          url: "string",
          why_relevant: "string (1 sentence)",
          confidence: "number (0..1)",
        },
      ],
    },
    rules: [
      "Return ONLY valid JSON matching the output_schema. No markdown, no extra keys.",
      "Ground the summary/steps/response in the ticket content. If key info is missing, ask minimal clarifying questions in draft_response.",
      "KB recommendations must come ONLY from kb_corpus. If none are relevant, return kb_articles: [].",
    ],
    ticket,
    kb_corpus: kbCorpus,
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
  if (!res.ok) {
    return NextResponse.json(
      { error: "Lyzr inference error", status: res.status, body: raw },
      { status: 502 }
    );
  }

  const coerced = coerceToInsightsJsonString(raw);
  if (!coerced.ok) {
    return NextResponse.json(
      { error: "Unable to extract JSON from agent response", extractError: coerced.error, raw },
      { status: 502 }
    );
  }

  const parsed = safeJsonParse<TicketInsights>(
    escapeControlCharsInsideStrings(coerced.jsonString)
  );
  if (!parsed.ok) {
    return NextResponse.json(
      { error: "Unable to parse agent response as JSON", parseError: parsed.error, raw },
      { status: 502 }
    );
  }

  // Minimal shape validation to avoid UI crashes.
  const v = parsed.value as Partial<TicketInsights> & Record<string, unknown>;

  const summary = typeof v.summary === "string" ? v.summary : null;
  const issue_reported = typeof v.issue_reported === "string" ? v.issue_reported : null;
  const draft_response = typeof v.draft_response === "string" ? v.draft_response : null;
  const next_steps = Array.isArray(v.next_steps) ? (v.next_steps as unknown[]) : null;
  const kb_articles_raw = Array.isArray(v.kb_articles) ? (v.kb_articles as unknown[]) : [];

  if (!summary || !issue_reported || !draft_response || !next_steps) {
    return NextResponse.json(
      { error: "Agent response did not match expected shape", raw, parsed: v },
      { status: 502 }
    );
  }

  const normalized: TicketInsights = {
    summary,
    issue_reported,
    next_steps: next_steps.filter((x): x is string => typeof x === "string"),
    draft_response,
    kb_articles: kb_articles_raw
      .map((a) => (typeof a === "object" && a ? (a as Record<string, unknown>) : null))
      .filter(Boolean)
      .map((a) => ({
        id: typeof a!.id === "string" ? a!.id : "",
        title: typeof a!.title === "string" ? a!.title : "",
        url: typeof a!.url === "string" ? a!.url : "",
        why_relevant: typeof a!.why_relevant === "string" ? a!.why_relevant : "",
        confidence: typeof a!.confidence === "number" ? a!.confidence : 0.5,
      }))
      .filter((a) => a.id && a.title && a.url),
  };

  return NextResponse.json(normalized);
}

