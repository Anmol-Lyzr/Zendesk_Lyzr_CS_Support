import type { Ticket } from "@/lib/mockTickets";
import { cn } from "@/lib/cn";
import { formatShortDateTime } from "@/lib/dates";

export function ConversationThread({ ticket }: { ticket: Ticket }) {
  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-auto bg-[var(--z-canvas)] px-6 py-5">
      <div className="mx-auto w-full max-w-[760px]">
        <div className="rounded-xl border border-[var(--z-border)] bg-[var(--z-panel)] px-5 py-5">
          <div className="space-y-5">
          {ticket.conversation
            .slice()
            .sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1))
            .reverse()
            .map((m) => (
              <div key={m.id} className="flex gap-3">
                <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-slate-100 text-xs font-semibold text-slate-700 ring-1 ring-[var(--z-border)]">
                  {m.authorName.slice(0, 1).toUpperCase()}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <div className="text-sm font-semibold text-slate-900">
                      {m.authorName}
                    </div>
                    {m.visibility === "internal" ? (
                      <span className="rounded-md bg-amber-100 px-2 py-0.5 text-[11px] font-semibold text-amber-800">
                        internal
                      </span>
                    ) : null}
                    <div className="text-xs text-slate-500">
                      {formatShortDateTime(m.createdAt)}
                    </div>
                  </div>
                  <div
                    className={cn(
                      "mt-1 rounded-lg border border-[var(--z-border)] px-3 py-2 text-sm leading-6 text-slate-800 shadow-[0_1px_0_rgba(15,23,42,0.04)]",
                      m.visibility === "internal"
                        ? "bg-amber-50"
                        : "bg-white"
                    )}
                    style={{ whiteSpace: "pre-wrap" }}
                  >
                    {m.body}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

