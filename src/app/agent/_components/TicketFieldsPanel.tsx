import type { Ticket } from "@/lib/mockTickets";
import { Badge } from "@/app/agent/_components/ui/Badge";
import { ChevronRight } from "lucide-react";

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-1">
      <div className="text-[11px] font-medium text-slate-500">{label}</div>
      <div className="text-sm text-slate-900">{children}</div>
    </div>
  );
}

function PanelCard({
  title,
  subtitle,
  children,
  onMore,
}: {
  title?: string;
  subtitle?: string;
  children: React.ReactNode;
  onMore?: () => void;
}) {
  return (
    <section className="overflow-hidden rounded-lg border border-[var(--z-border)] bg-[var(--z-panel)]">
      {title ? (
        <div className="border-b border-[var(--z-border)] bg-[var(--z-panel-2)] px-3.5 py-2.5">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <div className="text-[11px] font-semibold text-slate-700">{title}</div>
              {subtitle ? (
                <div className="mt-0.5 text-[11px] text-slate-500">{subtitle}</div>
              ) : null}
            </div>
            {onMore ? (
              <button
                type="button"
                className="inline-flex items-center gap-1 text-[11px] font-semibold text-slate-500 hover:text-[var(--z-brand)]"
                aria-label="More"
                onClick={onMore}
              >
                More <ChevronRight className="h-3.5 w-3.5" />
              </button>
            ) : null}
          </div>
        </div>
      ) : null}
      <div className="px-3.5 py-3">{children}</div>
    </section>
  );
}

export function TicketFieldsPanel({ ticket }: { ticket: Ticket }) {
  return (
    <div className="flex h-full flex-col">
      <div className="border-b border-[var(--z-border)] bg-[var(--z-panel)] px-4 py-3">
        <div className="text-xs font-semibold text-slate-800">Customer</div>
        <div className="mt-0.5 text-xs text-slate-500">
          Organization (create)
        </div>
      </div>

      <div className="flex flex-1 flex-col gap-3 overflow-auto bg-[var(--z-canvas)] px-4 py-4">
        <PanelCard>
          <Field label="Requester">
            <div className="flex items-center gap-2">
              <div className="flex h-7 w-7 items-center justify-center rounded-full bg-slate-100 text-xs font-semibold text-slate-700">
                {ticket.requester.name.slice(0, 1).toUpperCase()}
              </div>
              <div className="min-w-0">
                <div className="truncate font-medium">{ticket.requester.name}</div>
                <div className="truncate text-[12px] text-slate-500">
                  {ticket.requester.orgName}
                </div>
              </div>
            </div>
          </Field>
          <div className="mt-3 grid gap-3">
            <Field label="Assignee">
              <div className="flex items-center justify-between gap-3">
                <span className="truncate font-medium">{ticket.assigneeName}</span>
                <button
                  type="button"
                  className="shrink-0 rounded-full px-2 py-1 text-[11px] font-semibold text-[var(--z-brand)] hover:bg-[color-mix(in_srgb,var(--z-brand)_10%,white)]"
                >
                  take it
                </button>
              </div>
            </Field>
            <Field label="Followers">
              <div className="flex items-center justify-between gap-3">
                <span className="min-w-0 truncate text-slate-700">
                  {ticket.followers.length ? ticket.followers.join(", ") : "—"}
                </span>
                <button
                  type="button"
                  className="shrink-0 rounded-full px-2 py-1 text-[11px] font-semibold text-[var(--z-brand)] hover:bg-[color-mix(in_srgb,var(--z-brand)_10%,white)]"
                >
                  follow
                </button>
              </div>
            </Field>
          </div>
        </PanelCard>

        <PanelCard title="Tags">
          <div className="flex flex-wrap gap-2">
            {ticket.tags.map((t) => (
              <Badge key={t} variant="neutral">
                {t}
              </Badge>
            ))}
          </div>
          <div className="mt-3 grid grid-cols-2 gap-3">
            <Field label="Type">
              <div className="rounded-md border border-[var(--z-border)] bg-white px-2 py-1 text-sm capitalize">
                {ticket.type}
              </div>
            </Field>
            <Field label="Priority">
              <div className="rounded-md border border-[var(--z-border)] bg-white px-2 py-1 text-sm capitalize">
                {ticket.priority}
              </div>
            </Field>
          </div>
        </PanelCard>

        <PanelCard title="Summary" subtitle="Agent generated">
          <div className="grid gap-3">
            <Field label="Summary agent ID">
              <div className="h-9 rounded-md border border-[var(--z-border)] bg-[var(--z-panel-2)]" />
            </Field>
            <Field label="Summary date and time">
              <div className="h-9 rounded-md border border-[var(--z-border)] bg-[var(--z-panel-2)]" />
            </Field>
            <Field label="Summary locale">
              <div className="h-9 rounded-md border border-[var(--z-border)] bg-[var(--z-panel-2)]" />
            </Field>
            <Field label="Summary">
              <div className="h-20 rounded-md border border-[var(--z-border)] bg-[var(--z-panel-2)]" />
            </Field>
          </div>
        </PanelCard>
      </div>

      <div className="border-t border-[var(--z-border)] bg-[var(--z-panel)] p-3">
        <button
          type="button"
          className="w-full rounded-md border border-[var(--z-border)] bg-white px-3 py-2 text-left text-sm text-slate-700 hover:bg-[var(--z-hover)]"
        >
          Apply macro
        </button>
      </div>
    </div>
  );
}

