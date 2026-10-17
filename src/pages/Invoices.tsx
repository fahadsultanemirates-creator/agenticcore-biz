import { Link } from "react-router-dom";
import { BillingSection } from "../components/dashboard/BillingSection";
import { DashboardNav } from "../components/dashboard/DashboardNav";
import { DashboardShell } from "../components/dashboard/DashboardShell";
import { MONTHLY_BILLING_NOTE, paymentSplitSentence } from "../data/paymentTerms";
import {
  amountOutstanding,
  useBilling,
  useSubscriptions,
} from "../lib/dashboardData";
import { BILLING_EMAIL, money } from "../lib/payment";

/**
 * Money, on its own page.
 *
 * Read-only, and it has to be: `billing` has a select-own policy and no
 * insert policy at all, so this page could not raise an invoice even if
 * it tried. Payment instructions live on the order that is awaiting a
 * deposit, where the amount and the reason are both in view.
 *
 * The table and the monthly-package cards are BillingSection, the same
 * component the dashboard renders, with its own heading suppressed. Two
 * separate views of the same money is how they start disagreeing.
 *
 * The closing note says a person confirms payment. That is .biz's actual
 * process and it is not .agency's: Agency runs a watcher that sees the
 * transaction on the chain, .biz does not, and there is no watcher
 * function in supabase/functions here. Copying Agency's sentence would
 * have read better and been false.
 */
export function Invoices() {
  const billing = useBilling();
  const subscriptions = useSubscriptions();
  const outstanding = amountOutstanding(billing.rows);

  return (
    <DashboardShell title="Invoices & Payments">
      <DashboardNav />
      <section className="py-8">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h1 className="font-display text-2xl font-semibold text-fg sm:text-3xl">
              Invoices &amp; Payments
            </h1>
            <p className="mt-1.5 max-w-xl text-sm text-fg-muted">
              {paymentSplitSentence()}. Paid in USDT on BNB Smart Chain.{" "}
              <Link to="/terms" className="font-semibold text-orange-400 hover:underline">
                Read the full payment terms
              </Link>
              .
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

        <BillingSection
          billing={billing}
          subscriptions={subscriptions}
          outstanding={outstanding}
          showHeading={false}
        />

        <div className="mt-6 flex flex-col gap-2 text-xs text-fg-faint">
          <p>
            A payment is confirmed by a person here, not detected automatically. Send it, tell us
            in the dashboard, and we confirm it and move your work forward.
          </p>
          <p>{MONTHLY_BILLING_NOTE}</p>
          <p>
            Something look wrong?{" "}
            <a
              href={`mailto:${BILLING_EMAIL}`}
              className="font-semibold text-orange-400 hover:underline"
            >
              {BILLING_EMAIL}
            </a>
          </p>
        </div>
      </section>
    </DashboardShell>
  );
}
