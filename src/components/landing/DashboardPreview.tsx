import { BarChart3, FolderKanban, Inbox, ListChecks, Sparkles, Wallet } from "lucide-react";

/**
 * A representative panel of the dashboard, built rather than screenshot.
 *
 * Every figure here is obviously sample data and labelled as such. The
 * brief is explicit about not publishing invented customer results or
 * fabricated revenue growth, and a mock that looks like a real account
 * is one screenshot away from being quoted as one.
 */
const PANELS = [
  { icon: ListChecks, label: "Business tasks", value: "4 open", note: "2 awaiting your input" },
  { icon: Inbox, label: "Customer enquiries", value: "7 new", note: "oldest 2 days" },
  { icon: BarChart3, label: "Financial reports", value: "March", note: "ready to download" },
  { icon: FolderKanban, label: "Active projects", value: "2", note: "1 in review" },
  { icon: Wallet, label: "Monthly operations", value: "On track", note: "renews 1 April" },
  { icon: Sparkles, label: "Forge assistant", value: "Ready", note: "describe your next job" },
];

export function DashboardPreview() {
  return (
    <div className="animate-fade-up mx-auto mt-16 max-w-4xl md:mt-20" style={{ animationDelay: "150ms" }}>
      <div className="overflow-hidden rounded-2xl border border-border bg-surface shadow-glow">
        <div className="flex items-center gap-2 border-b border-border px-4 py-3">
          <span className="h-2.5 w-2.5 rounded-full bg-orange-400/70" />
          <span className="h-2.5 w-2.5 rounded-full bg-border" />
          <span className="h-2.5 w-2.5 rounded-full bg-border" />
          <span className="ml-2 text-xs font-medium text-fg-faint">
            Your dashboard — sample data
          </span>
        </div>

        <div className="grid grid-cols-2 gap-3 p-4 sm:grid-cols-3 sm:p-5">
          {PANELS.map((panel) => (
            <div key={panel.label} className="rounded-xl border border-border bg-void p-3.5 text-left">
              <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-orange-400/10">
                <panel.icon className="h-4 w-4 text-orange-400" strokeWidth={2.25} />
              </span>
              <p className="mt-2.5 text-xs font-medium text-fg-muted">{panel.label}</p>
              <p className="font-display text-lg font-semibold text-fg">{panel.value}</p>
              <p className="text-xs text-fg-faint">{panel.note}</p>
            </div>
          ))}
        </div>
      </div>
      <p className="mt-2 text-center text-xs text-fg-faint">
        Illustration of the customer dashboard. Figures are sample data, not a real account.
      </p>
    </div>
  );
}
