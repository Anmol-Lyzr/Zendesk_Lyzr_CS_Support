import type { TicketSentiment } from "@/lib/mockTickets";
import { Badge } from "@/app/agent/_components/ui/Badge";

export function SentimentCard({ sentiment }: { sentiment: TicketSentiment }) {
  const labelTone =
    sentiment.sentimentLabel === "negative"
      ? "negative"
      : sentiment.sentimentLabel === "positive"
        ? "positive"
        : "neutral";

  const labelVariant =
    labelTone === "negative" ? "danger" : labelTone === "positive" ? "success" : "neutral";

  return (
    <div className="overflow-hidden rounded-lg border border-[var(--z-border)] bg-white">
      <div className="flex items-center justify-between border-b border-[var(--z-border)] bg-[var(--z-panel-2)] px-4 py-3">
        <div className="text-sm font-semibold text-slate-900">Sentiment</div>
        <Badge variant={labelVariant}>
          {sentiment.sentimentLabel === "negative"
            ? "Negative"
            : sentiment.sentimentLabel === "positive"
              ? "Positive"
              : "Neutral"}
        </Badge>
      </div>
      <div className="grid grid-cols-2 gap-6 px-4 pb-4 pt-1">
        <div>
          <div className="text-xs font-medium text-slate-500">Satisfaction level</div>
          <div className="mt-1 text-base font-semibold text-slate-900">
            {sentiment.satisfactionLevel}
          </div>
        </div>
        <div>
          <div className="text-xs font-medium text-slate-500">Confusion level</div>
          <div className="mt-1 text-base font-semibold text-slate-900">
            {sentiment.confusionLevel}
          </div>
        </div>
        <div>
          <div className="text-xs font-medium text-slate-500">Urgency level</div>
          <div className="mt-1 text-base font-semibold text-slate-900">
            {sentiment.urgencyLevel}
          </div>
        </div>
        <div>
          <div className="text-xs font-medium text-slate-500">Sentiment score</div>
          <div className="mt-1 text-base font-semibold text-slate-900">
            {sentiment.sentimentScore}/10
          </div>
        </div>
      </div>
      <div className="px-4 pb-4">
        <div className="text-xs font-medium text-slate-500">Sentiment label</div>
        <div className="mt-2 flex items-center gap-2">
          <LabelPill active={sentiment.sentimentLabel === "neutral"} tone="neutral">
            Neutral
          </LabelPill>
          <LabelPill active={sentiment.sentimentLabel === "negative"} tone="negative">
            -ve
          </LabelPill>
          <LabelPill active={sentiment.sentimentLabel === "positive"} tone="positive">
            +ve
          </LabelPill>
        </div>
      </div>
    </div>
  );
}

function LabelPill({
  children,
  active,
  tone,
}: {
  children: React.ReactNode;
  active: boolean;
  tone: "neutral" | "negative" | "positive";
}) {
  const base = "rounded-full px-3 py-1 text-xs font-medium border transition-colors";
  const inactive = "bg-white text-slate-500 border-slate-200";
  const activeTone =
    tone === "neutral"
      ? "bg-white text-slate-900 border-slate-200"
      : tone === "negative"
        ? "bg-rose-50 text-rose-700 border-rose-200"
        : "bg-emerald-50 text-emerald-700 border-emerald-200";

  return <span className={`${base} ${active ? activeTone : inactive}`}>{children}</span>;
}

// Note: badge styling is handled by the shared <Badge /> component above.

