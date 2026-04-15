"use client";

import * as React from "react";
import type { Ticket } from "@/lib/mockTickets";
import { Button } from "@/app/agent/_components/ui/Button";
import { Paperclip, SendHorizontal, Smile } from "lucide-react";
import { useDraftStore } from "@/app/agent/_state/draftStore";

function LyzrLogoIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true" {...props}>
      <rect x="2" y="2" width="20" height="20" rx="5" fill="currentColor" />
      <path
        d="M8 7.5 12 11.5 9.5 14 12 16.5M16 7.5 12 11.5 14.5 14 12 16.5"
        stroke="#fff"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function ReplyComposer({ ticket }: { ticket: Ticket }) {
  const { draftByTicketId, setDraft } = useDraftStore();
  const value = draftByTicketId[ticket.id] ?? "";
  const [isDrafting, setIsDrafting] = React.useState(false);
  const [draftError, setDraftError] = React.useState<string | null>(null);

  async function draftWithLyzr() {
    setIsDrafting(true);
    setDraftError(null);
    try {
      const res = await fetch(`/api/lyzr/insights/${ticket.id}`, { cache: "no-store" });
      const data = (await res.json()) as { draft_response?: string; error?: string };
      if (!res.ok) {
        throw new Error(typeof data.error === "string" ? data.error : `Request failed (${res.status})`);
      }
      if (!data.draft_response || typeof data.draft_response !== "string") {
        throw new Error("Agent response missing draft_response");
      }
      setDraft(ticket.id, data.draft_response);
    } catch (e) {
      setDraftError(e instanceof Error ? e.message : String(e));
    } finally {
      setIsDrafting(false);
    }
  }

  return (
    <div className="border-t border-[var(--z-border)] bg-[var(--z-panel)] px-6 py-4">
      <div className="mx-auto w-full max-w-[760px]">
        <div className="flex items-center justify-between gap-3 text-xs text-slate-500">
          <div className="flex items-center gap-2">
            <button
              type="button"
              className="rounded-full px-2 py-1 font-medium text-slate-600 hover:bg-[var(--z-hover)] hover:text-slate-900"
            >
              Public reply
            </button>
            <span>·</span>
            <span className="truncate">{ticket.requester.name}, {ticket.assigneeName}</span>
          </div>
        </div>

        <div className="mt-2 overflow-hidden rounded-xl border border-[var(--z-border)] bg-white shadow-[0_1px_0_rgba(15,23,42,0.04)] [color-scheme:light]">
          <textarea
            value={value}
            onChange={(e) => setDraft(ticket.id, e.target.value)}
            placeholder="Type your reply…"
            className="h-28 w-full resize-none border-0 bg-white px-4 py-3 text-sm leading-relaxed text-slate-900 outline-none placeholder:text-slate-500 dark:text-slate-900"
          />
          {draftError ? (
            <div className="px-4 pb-1 text-xs text-rose-600">{draftError}</div>
          ) : null}
          <div className="flex items-center justify-between border-t border-[var(--z-border)] bg-[var(--z-panel-2)] px-3 py-2">
            <div className="flex items-center gap-1">
              <button
                type="button"
                className="inline-flex h-8 w-8 items-center justify-center rounded-md text-slate-600 hover:bg-white"
                aria-label="Emoji"
              >
                <Smile className="h-4 w-4" />
              </button>
              <button
                type="button"
                className="inline-flex h-8 w-8 items-center justify-center rounded-md text-slate-600 hover:bg-white"
                aria-label="Attach file"
              >
                <Paperclip className="h-4 w-4" />
              </button>
              <button
                type="button"
                onClick={() => void draftWithLyzr()}
                className="inline-flex h-8 w-8 items-center justify-center rounded-md text-slate-900 hover:bg-white disabled:cursor-not-allowed disabled:opacity-60"
                aria-label="Draft with Lyzr"
                disabled={isDrafting}
              >
                <LyzrLogoIcon className="h-5 w-5 text-black" />
              </button>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="secondary" size="sm">
                Submit as Open
              </Button>
              <Button variant="primary" size="sm">
                <SendHorizontal className="h-4 w-4" />
                Send
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

