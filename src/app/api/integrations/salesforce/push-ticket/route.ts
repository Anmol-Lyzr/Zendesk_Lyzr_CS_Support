import { NextResponse } from "next/server";

type TicketPayload = {
  ticketId?: string;
  ticket?: {
    id?: string;
    subject?: string;
    status?: string;
    priority?: string;
    tags?: string[];
    requester?: { name?: string; email?: string; orgName?: string };
    assigneeName?: string;
    lyzr?: { summary?: string; issueReported?: string };
  };
};

function makeDemoId(prefix: string) {
  const n = Math.floor(Math.random() * 1_000_000);
  return `${prefix}_${String(n).padStart(6, "0")}`;
}

async function tryPushToSalesforce(payload: Required<TicketPayload>) {
  const instanceUrl = process.env.SALESFORCE_INSTANCE_URL;
  const accessToken = process.env.SALESFORCE_ACCESS_TOKEN;
  if (!instanceUrl || !accessToken) return null;

  const t = payload.ticket ?? {};
  const ticketId = payload.ticketId;
  const tags = (t.tags ?? []).join(", ");
  const requester = t.requester ?? {};

  // Minimal generic payload: create a Case. If the org doesn't allow it, we fall back to demo.
  const body = {
    Subject: `[Ticket] TKT-${ticketId} ${t.subject ?? ""}`.trim(),
    Description: [
      `Ticket: TKT-${ticketId}`,
      `Subject: ${t.subject ?? ""}`,
      `Status: ${t.status ?? "Unknown"}`,
      `Priority: ${t.priority ?? "Unknown"}`,
      `Assignee: ${t.assigneeName ?? "Unassigned"}`,
      `Requester: ${requester.name ?? "Unknown"} (${requester.email ?? "Unknown"})`,
      `Org: ${requester.orgName ?? "Unknown"}`,
      tags ? `Tags: ${tags}` : "",
      "",
      t.lyzr?.issueReported ? `Issue reported: ${t.lyzr.issueReported}` : "",
      t.lyzr?.summary ? `Summary: ${t.lyzr.summary}` : "",
    ]
      .filter(Boolean)
      .join("\n"),
    Origin: "Support",
  };

  const res = await fetch(
    `${instanceUrl.replace(/\/$/, "")}/services/data/v59.0/sobjects/Case`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    }
  );

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
  const body = (await req.json().catch(() => null)) as TicketPayload | null;
  const ticketId = body?.ticketId;
  const ticket = body?.ticket;

  if (!ticketId) {
    return NextResponse.json({ error: "Missing ticketId" }, { status: 400 });
  }

  const payload: Required<TicketPayload> = {
    ticketId,
    ticket: ticket ?? {},
  };

  const pushed = await tryPushToSalesforce(payload);
  if (pushed?.ok) {
    return NextResponse.json({
      ok: true,
      mode: "salesforce",
      ticketId,
      salesforceId: pushed.salesforceId,
    });
  }

  // Demo-mode success response.
  return NextResponse.json({
    ok: true,
    mode: "demo",
    ticketId,
    salesforceId: makeDemoId("sf_demo"),
    message:
      "Demo mode: configure SALESFORCE_INSTANCE_URL and SALESFORCE_ACCESS_TOKEN for a real push.",
  });
}

