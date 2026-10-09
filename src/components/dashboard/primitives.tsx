import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";
import { statusLabel } from "../../lib/dashboardData";

/**
 * The four states every panel on the dashboard has, handled once.
 *
 * Loading, failed, empty and loaded are genuinely different, and the one
 * that gets skipped is always `failed` -- which then renders as `empty`.
 * "Nothing here yet" and "we could not load it" look identical to a client
 * and mean opposite things, so one of them must offer a retry.
 */
export function Panel({
  loading,
  failed,
  reload,
  empty,
  emptyIcon: EmptyIcon,
  emptyText,
  children,
}: {
  loading: boolean;
  failed: boolean;
  reload: () => Promise<void>;
  empty: boolean;
  emptyIcon: LucideIcon;
  emptyText: string;
  children: ReactNode;
}) {
  if (loading) {
    return (
      <p className="mt-5 rounded-2xl border border-dashed border-border bg-surface p-6 text-sm text-fg-faint">
        Loading…
      </p>
    );
  }

  if (failed) {
    return (
      <div className="mt-5 rounded-2xl border border-dashed border-border bg-surface p-6">
        <p className="text-sm text-fg-muted">We couldn't load this just now.</p>
        <button
          type="button"
          onClick={() => void reload()}
          className="mt-3 text-sm font-semibold text-orange-400 hover:underline"
        >
          Try again
        </button>
      </div>
    );
  }

  if (empty) {
    return (
      <div className="mt-5 rounded-2xl border border-dashed border-border bg-surface p-8 text-center">
        <EmptyIcon className="mx-auto h-8 w-8 text-fg-faint" />
        <p className="mt-3 text-sm text-fg-muted">{emptyText}</p>
      </div>
    );
  }

  return <>{children}</>;
}

/** Statuses that mean the client has to do something are the loud ones. */
const NEEDS_CLIENT = new Set(["awaiting_payment", "awaiting_review", "pending"]);

export function StatusPill({ status }: { status: string }) {
  const loud = NEEDS_CLIENT.has(status);
  return (
    <span
      className={`shrink-0 rounded-full px-2.5 py-1 text-[11px] font-bold tracking-wide uppercase ${
        loud ? "bg-orange-400 text-void" : "bg-surface-2 text-fg-muted"
      }`}
    >
      {statusLabel(status)}
    </span>
  );
}
