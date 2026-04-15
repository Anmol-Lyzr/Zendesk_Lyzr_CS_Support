import type { TicketSentiment } from "@/lib/mockTickets";

export function SentimentCard({ sentiment }: { sentiment: TicketSentiment }) {
  return (
    <div className="overflow-hidden rounded-lg border border-[var(--z-border)] bg-[#f3fae8]">
      <div className="flex items-center justify-between px-4 py-3">
        <div className="text-base font-semibold text-slate-900">Sentiment</div>
        <div className="text-slate-700">⌃</div>
      </div>
      <div className="grid grid-cols-2 gap-6 px-4 pb-4 pt-1">
        <div>
          <div className="text-sm text-slate-700">Satisfaction level</div>
          <div className="mt-1 text-xl font-semibold text-slate-900">
            {sentiment.satisfactionLevel}
          </div>
        </div>
        <div>
          <div className="text-sm text-slate-700">Confusion level</div>
          <div className="mt-1 text-xl font-semibold text-slate-900">
            {sentiment.confusionLevel}
          </div>
        </div>
        <div>
          <div className="text-sm text-slate-700">Urgency level</div>
          <div className="mt-1 text-xl font-semibold text-slate-900">
            {sentiment.urgencyLevel}
          </div>
        </div>
        <div>
          <div className="text-sm text-slate-700">Sentiment score</div>
          <div className="mt-1 text-xl font-semibold text-slate-900">
            {sentiment.sentimentScore}/10
          </div>
        </div>
      </div>
      <div className="px-4 pb-4">
        <div className="text-sm text-slate-700">Sentiment label</div>
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
  const base =
    "rounded-full px-4 py-1 text-sm font-medium border transition-colors";
  const inactive = "bg-white/50 text-slate-500 border-slate-200";
  const activeTone =
    tone === "neutral"
      ? "bg-white text-slate-900 border-slate-200"
      : tone === "negative"
        ? "bg-rose-200 text-rose-800 border-rose-200"
        : "bg-emerald-200 text-emerald-800 border-emerald-200";

  return <span className={`${base} ${active ? activeTone : inactive}`}>{children}</span>;
}

