import { AgentShell } from "@/app/agent/_components/AgentShell";
import { AnalyticsDashboard } from "@/app/agent/analytics/AnalyticsDashboard";

export default function AnalyticsPage() {
  return (
    <div
      style={
        {
          // Keep this page on a Zendesk-like teal without changing global theme.
          ["--z-brand" as never]: "#0f766e",
          ["--z-brand-2" as never]: "#14b8a6",
        } as React.CSSProperties
      }
    >
      <AgentShell
        leftRail={<div />}
        leftPanel={null}
        centerHeader={null}
        center={
          <div className="flex min-h-0 flex-1 flex-col bg-[var(--z-canvas)]">
            <AnalyticsDashboard />
          </div>
        }
        rightPanel={null}
      />
    </div>
  );
}

