"use client";

import * as React from "react";
import type { Ticket } from "@/lib/mockTickets";
import { Button } from "@/app/agent/_components/ui/Button";
import { Paperclip, SendHorizontal, Smile } from "lucide-react";
import { useDraftStore } from "@/app/agent/_state/draftStore";

export function ReplyComposer({ ticket }: { ticket: Ticket }) {
  const { draftByTicketId, setDraft } = useDraftStore();
  const value = draftByTicketId[ticket.id] ?? "";

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

