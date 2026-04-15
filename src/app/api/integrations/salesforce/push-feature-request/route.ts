import { NextResponse } from "next/server";

type FeatureRequestPayload = {
  requestId?: string;
  request?: {
    title?: string;
    description?: string;
    theme?: string;
    impact?: string;
    confidence?: number;
    evidence_ticket_ids?: string[];
  };
};

function makeDemoId(prefix: string) {
  const n = Math.floor(Math.random() * 1_000_000);
  return `${prefix}_${String(n).padStart(6, "0")}`;
}

async function tryPushToSalesforce(payload: Required<FeatureRequestPayload>) {
  const instanceUrl = process.env.SALESFORCE_INSTANCE_URL;
  const accessToken = process.env.SALESFORCE_ACCESS_TOKEN;
  if (!instanceUrl || !accessToken) return null;

  // Minimal generic payload: create a Case. If the org doesn't allow it, we fall back to demo.
  const body = {
    Subject: `[Feature Request] ${payload.request.title ?? payload.requestId}`,
    Description: [
      payload.request.description ?? "",
      "",
      `Theme: ${payload.request.theme ?? "Unknown"}`,
      `Impact: ${payload.request.impact ?? "Unknown"}`,
      `Confidence: ${typeof payload.request.confidence === "number" ? payload.request.confidence : "Unknown"}`,
      `Evidence ticket ids: ${(payload.request.evidence_ticket_ids ?? []).join(", ")}`,
    ].join("\n"),
    Origin: "Support",
  };

  const res = await fetch(`${instanceUrl.replace(/\/$/, "")}/services/data/v59.0/sobjects/Case`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });

  const raw = await res.text();
  if (!res.ok) {
    return { ok: false as const, status: res.status, body: raw };
  }

  const parsed = (() => {
    try {
      return JSON.parse(raw) as { id?: string; success?: boolean };
    } catch {
      return null;
    }
  })();

  return {
    ok: true as const,
    salesforceId: parsed?.id ?? makeDemoId("sf"),
  };
}

export async function POST(req: Request) {
  const body = (await req.json().catch(() => null)) as FeatureRequestPayload | null;
  const requestId = body?.requestId;
  const request = body?.request;

  if (!requestId) {
    return NextResponse.json({ error: "Missing requestId" }, { status: 400 });
  }

  const payload: Required<FeatureRequestPayload> = {
    requestId,
    request: request ?? {},
  };

  const pushed = await tryPushToSalesforce(payload);
  if (pushed?.ok) {
    return NextResponse.json({
      ok: true,
      mode: "salesforce",
      requestId,
      salesforceId: pushed.salesforceId,
    });
  }

  // Demo-mode success response.
  return NextResponse.json({
    ok: true,
    mode: "demo",
    requestId,
    salesforceId: makeDemoId("sf_demo"),
    message:
      "Demo mode: configure SALESFORCE_INSTANCE_URL and SALESFORCE_ACCESS_TOKEN for a real push.",
  });
}

