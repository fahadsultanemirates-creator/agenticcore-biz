import { Receipt, Repeat } from "lucide-react";
import { packageById } from "../../data/catalog";
import { statusLabel, type BillingRow, type SubscriptionRow } from "../../lib/dashboardData";
import { money } from "../../lib/payment";
import { Panel, StatusPill } from "./primitives";

/**
 * Money: what is owed, what has been paid, and what recurs.
 *
 * Read-only. Every row here is written by the owner's side -- a client
 * cannot invoice themselves, and `billing` has a select-own policy and no
 * insert policy at all, so this panel could not create one even if it tried.
 * Payment instructions live on the request that is awaiting payment, where
 * the amount and the reason are both in view.
 */
export function BillingSection({
  billing,
  subscriptions,
  outstanding,
}: {
  billing: {
    rows: BillingRow[];
    loading: boolean;
    failed: boolean;
    reload: () => Promise<void>;
  };
  subscriptions: {
    rows: SubscriptionRow[];
    loading: boolean;
    failed: boolean;
    reload: () => Promise<void>;
  };
  outstanding: number;
}) {
  return (
    <section id="billing" className="scroll-mt-20 border-t border-border py-8 sm:py-10">
      <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-end">
        <div>
          <h2 className="font-display text-xl font-semibold text-fg sm:text-2xl">Billing</h2>
          <p className="mt-1 text-sm text-fg-muted">
            30% to start, the balance when the work is approved. No credits, no subscriptions you
            didn't ask for.
          </p>
        </div>
        {outstanding > 0 ? (
          <div className="rounded-xl border-2 border-orange-400 bg-orange-400/5 px-4 py-2.5 text-right">
            <p className="text-xs font-semibold tracking-wide text-fg-faint uppercase">
              Outstanding
            </p>
            <p className="font-display text-xl font-semibold text-orange-400 tabular-nums">
              {money(outstanding)}
            </p>
          </div>
        ) : null}
      </div>

      <Panel
        loading={billing.loading}
        failed={billing.failed}
        reload={billing.reload}
        empty={billing.rows.length === 0}
        emptyIcon={Receipt}
        emptyText="Nothing invoiced yet. Invoices appear here once we've agreed a price."
      >
        <div className="mt-5 overflow-hidden rounded-2xl border border-border">
          <table className="w-full text-left text-sm">
            <thead className="bg-surface-2 text-xs tracking-wide text-fg-faint uppercase">
              <tr>
                <th scope="col" className="px-4 py-2.5 font-semibold">
                  Date
                </th>
                <th scope="col" className="px-4 py-2.5 font-semibold">
                  Stage
                </th>
                <th scope="col" className="px-4 py-2.5 text-right font-semibold">
                  Amount
                </th>
                <th scope="col" className="px-4 py-2.5 text-right font-semibold">
                  Status
                </th>
              </tr>
            </thead>
            <tbody>
              {billing.rows.map((row) => (
                <tr key={row.id} className="border-t border-border bg-surface">
                  <td className="px-4 py-3 text-fg-muted">
                    {new Date(row.created_at).toLocaleDateString()}
                  </td>
                  <td className="px-4 py-3 text-fg-muted capitalize">
                    {row.payment_type === "upfront" ? "Deposit (30%)" : row.payment_type}
                  </td>
                  <td className="px-4 py-3 text-right font-semibold text-fg tabular-nums">
                    {money(Number(row.amount))}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <StatusPill status={row.status} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Panel>

      {/* Only rendered when there is something to show: an empty "no
          subscriptions" box on every dashboard is a feature advertising
          itself, not information. */}
      {!subscriptions.loading && subscriptions.rows.length > 0 ? (
        <div className="mt-8">
          <h3 className="flex items-center gap-2 font-display text-base font-semibold text-fg">
            <Repeat className="h-4 w-4 text-orange-400" /> Monthly packages
          </h3>
          <div className="mt-3 grid gap-3 sm:grid-cols-2">
            {subscriptions.rows.map((subscription) => {
              const pkg = packageById(subscription.package_key);
              return (
                <div
                  key={subscription.id}
                  className="rounded-2xl border border-border bg-surface p-4"
                >
                  <div className="flex items-start justify-between gap-3">
                    <p className="font-display text-base font-semibold text-fg">
                      {pkg?.name ?? subscription.package_key}
                    </p>
                    <StatusPill status={subscription.status} />
                  </div>
                  <p className="mt-1 text-sm text-fg-muted">
                    {money(Number(subscription.monthly_amount))}/month
                  </p>
                  <p className="mt-2 text-xs text-fg-faint">
                    {subscription.status === "cancelled"
                      ? `Ended ${new Date(subscription.next_due_date).toLocaleDateString()}`
                      : `Next due ${new Date(subscription.next_due_date).toLocaleDateString()}`}
                  </p>
                  {pkg?.terms ? <p className="mt-2 text-xs text-fg-faint">{pkg.terms}</p> : null}
                </div>
              );
            })}
          </div>
          <p className="mt-3 text-xs text-fg-faint">
            To pause or cancel a package, email us — {statusLabel("active")} packages are billed
            monthly until you say otherwise.
          </p>
        </div>
      ) : null}
    </section>
  );
}
