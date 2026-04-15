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
        leftPanel={
          <div className="flex h-full flex-col">
            <div className="px-4 py-4">
              <div className="text-xs font-semibold text-slate-600">
                Analytics
              </div>
              <div className="mt-1 text-sm font-semibold text-slate-900">
                Agent Analytics
              </div>
              <div className="mt-1 text-xs text-slate-500">
                Weekly insights across your support tickets.
              </div>
            </div>
            <div className="px-4 pb-4">
              <div className="rounded-lg border border-[var(--z-border)] bg-white p-3">
                <div className="text-xs font-semibold text-slate-700">
                  What you get
                </div>
                <div className="mt-2 space-y-1 text-xs text-slate-600">
                  <div>• Issue pattern recognition (weekly)</div>
                  <div>• Product feature request extraction</div>
                  <div>• Push to Salesforce</div>
                </div>
              </div>
            </div>
          </div>
        }
        centerHeader={
          <div className="border-b border-[var(--z-border)] bg-white">
            <div className="px-5 py-4">
              <div className="text-sm font-semibold text-slate-900">
                Analytics
              </div>
              <div className="mt-1 text-xs text-slate-500">
                Patterns, trends, and product signals from support tickets.
              </div>
            </div>
          </div>
        }
        center={
          <div className="flex min-h-0 flex-1 flex-col bg-[var(--z-canvas)]">
            <AnalyticsDashboard />
          </div>
        }
        rightPanel={
          <div className="flex h-full flex-col gap-4 overflow-auto bg-[var(--z-canvas)] p-4">
            <div className="rounded-lg border border-[var(--z-border)] bg-white p-4">
              <div className="text-xs font-semibold text-slate-700">
                How it works
              </div>
              <div className="mt-2 space-y-2 text-xs leading-5 text-slate-600">
                <div>
                  This dashboard analyzes tickets weekly to surface recurring
                  issues and actionable next steps.
                </div>
                <div>
                  It also extracts product feature requests and can push them to
                  Salesforce for your success teams.
                </div>
              </div>
            </div>
            <div className="rounded-lg border border-[var(--z-border)] bg-white p-4">
              <div className="text-xs font-semibold text-slate-700">
                Data source
              </div>
              <div className="mt-2 text-xs text-slate-600">
                Derived from your tickets.
              </div>
            </div>
          </div>
        }
      />
    </div>
  );
}

