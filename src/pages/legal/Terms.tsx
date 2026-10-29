import { Bullets, Clause, LegalLayout } from "./LegalLayout";
import { MONTHLY_BILLING_NOTE, PAYMENT_SPLIT } from "../../data/paymentTerms";
import { AC_TOKEN_DISCOUNT_PCT, AC_TOKEN_SITE } from "../../lib/payment";

/**
 * Replaces public/terms.html.
 *
 * The old file was titled "Payment & Delivery Policy" while the footer
 * linked to it as "Terms of Service". It was exactly what its own title
 * said: delivery estimates, the payment split, and a handover clause. There
 * was no ownership clause, no refund or cancellation terms, no limitation of
 * liability, no termination clause -- and, for a business that keeps other
 * people's books, no statement that this is not licensed accounting, tax or
 * legal advice. Those are the clauses below that have no predecessor.
 *
 * What carried over unchanged, because it was right: the 30/70 split (owner
 * confirmed), the monthly-billing exception, and review-before-handover.
 *
 * What was removed because nobody approved it: an earlier draft of this
 * page said we accept "bank transfer by arrangement for ongoing
 * engagements". That was a suggestion that had been made, never a policy
 * the owner agreed to, and a Terms page is the last place to float an
 * idea. USDT is what this site takes.
 *
 * The chain-confirmation wording was NOT copied from the .agency Terms
 * either: Agency watches the chain, .biz does not (UsdtPanel.tsx says so
 * too, and there is no watcher function in supabase/functions). Matching
 * the structure is right; matching that sentence would have been false.
 *
 * What was removed as untrue: references to chatbots, voice agents, real
 * estate developers, AI agent builds (that is .agency's catalogue, not this
 * one). AC token was removed here too, and has since been reinstated as a
 * second payment option at the owner's instruction -- see lib/payment.ts.
 */
export function Terms() {
  const { upfrontPercent, onCompletionPercent } = PAYMENT_SPLIT;

  return (
    <LegalLayout
      title="Terms of Service"
      eyebrow="Read before you order"
      updated="October 2026"
      intro="What we do, how payment and delivery work, who owns what, and the limits of what we can be held to. In plain language, and short enough to actually read."
    >
      <Clause heading="What AgenticCore.biz does">
        <p>
          We provide business setup, administration, bookkeeping support, back-office and growth
          services — the work listed in our catalogue, at the price shown on each service page.
        </p>
        <p>
          Most of it is performed inside systems you already own: your drive, your spreadsheets,
          your accounting software, your CRM. For many services there is nothing to download; the
          deliverable is that your records are set up, current and correct.
        </p>
      </Clause>

      <Clause heading="We are not your accountant, auditor or lawyer">
        <p>
          This matters more than anything else on this page, so it is near the top. Our bookkeeping,
          payroll and administration services are <strong className="text-fg">support services</strong>.
          We organise, record, reconcile and report on information you provide. We do not provide
          licensed accounting, audit, tax or legal advice, and nothing we deliver is a substitute
          for it.
        </p>
        <p>
          Filings, tax positions, statutory returns and legal obligations remain yours. Where a
          decision needs a licensed professional in your jurisdiction, engage one — we will work
          alongside them and hand over whatever they need.
        </p>
      </Clause>

      <Clause heading="Delivery timeframes">
        <Bullets
          items={[
            "Every service shows its own delivery estimate on its service page before you order.",
            "One-off setup work — checklists, trackers, document packs, research reports — is typically scoped and started within one working day.",
            "Bookkeeping setup and cleanup depends entirely on the state and volume of the records you hand over, which is why it is quoted rather than fixed.",
            "Ongoing monthly services run continuously rather than being delivered once.",
            "Estimates start when we have what the service page asks for — access, records, and answers to the intake questions — not when the order is placed.",
          ]}
        />
      </Clause>

      <Clause heading="Prices and quotations">
        <p>
          A service with a fixed price is that price. A service shown as “From” starts at that
          figure and is quoted once we have seen the scope. We put the scope, the price and the
          timeline in writing, and nothing is charged until you accept it.
        </p>
        <p>
          Software you keep in your own name — accounting subscriptions, cloud storage, CRM seats,
          payroll platforms, domains — is billed to you by those providers and is not included
          unless your quotation says so.
        </p>
      </Clause>

      <Clause heading="Payment">
        <p>
          One-off services follow the same structure throughout the catalogue:{" "}
          <strong className="text-fg">{upfrontPercent}% upfront</strong> to begin work, and the
          remaining <strong className="text-fg">{onCompletionPercent}%</strong> on completion. There
          is no separate pricing model for any plan — the split is identical across the board.
        </p>
        <p>{MONTHLY_BILLING_NOTE}</p>
        <p>
          Payment is in USDT on BNB Smart Chain (BEP-20). We do not process or store card numbers.
        </p>
        <p>
          You may instead pay in{" "}
          <a
            href={AC_TOKEN_SITE}
            target="_blank"
            rel="noopener noreferrer"
            className="font-semibold text-orange-400 hover:underline"
          >
            AC token
          </a>
          , which carries a <strong className="text-fg">{AC_TOKEN_DISCOUNT_PCT}% discount on
          everything</strong>. AC is itself a BEP-20 token, so it goes to the same address as
          USDT — there is no second address. The discount applies when the payment arrives in AC.
        </p>
        <p>
          Unlike our sister sites, a .biz payment is <strong className="text-fg">checked by a
          person</strong>, not detected automatically. Send it, tell us in the dashboard, and we
          confirm it and move your request forward.
        </p>
      </Clause>

      <Clause heading="Review before handover">
        <p>
          Before your final payment we show you the finished work for review. That review is not
          full handover. Once the remaining {onCompletionPercent}% is paid you get complete
          handover: files, access and ownership, in full.
        </p>
        <p>
          This protects both sides — you see exactly what you are paying for before the balance is
          due, and we are never left having delivered finished work with no payment behind it.
        </p>
      </Clause>

      <Clause heading="Access to your systems">
        <p>
          Where a service is performed inside your own systems you grant us access directly, from
          your own account — a shared folder, a guest seat, an invited user. You keep control of
          that access and can withdraw it at any time.
        </p>
        <p>
          We record what we have been given access to and the state of it.{" "}
          <strong className="text-fg">We do not ask for, and our systems do not store, your
          passwords or authentication tokens.</strong>{" "}
          If anyone contacts you asking for a password or a login code in our name, it is not us.
        </p>
      </Clause>

      <Clause heading="What we need from you">
        <p>
          We can only be as accurate as the information we are given. You are responsible for the
          completeness and accuracy of the records, figures and documents you provide, and for
          telling us when something changes — a new bank account, a closed entity, a payroll change.
        </p>
        <p>
          Work paused waiting on information from you does not count against a delivery estimate.
        </p>
      </Clause>

      <Clause heading="Ownership">
        <p>
          Everything produced for you — documents, spreadsheets, procedures, reports, trackers,
          records — is yours once paid for, to use commercially without restriction or credit.
        </p>
        <p>
          The underlying templates, tooling and methods we use to produce it stay ours, and we may
          use them for other clients. Your data, figures and documents are never used as another
          client's content.
        </p>
      </Clause>

      <Clause heading="Cancellation and refunds">
        <Bullets
          items={[
            `Before work starts, the ${upfrontPercent}% deposit is refundable in full.`,
            "Once work has started the deposit covers work already performed and is not refundable, but you are not charged the balance for anything not delivered.",
            "If we cannot deliver what was agreed, you are refunded in full — including the deposit.",
            "Ongoing monthly services can be cancelled any time before the next billing date and run to the end of the cycle already paid for. We do not pro-rate part-months.",
            "Where work is delivered and you believe it does not match what was agreed, tell us within 14 days and we will correct it or refund that service.",
          ]}
        />
      </Clause>

      <Clause heading="Confidentiality">
        <p>
          Your business information is confidential. We do not disclose it, and we do not discuss
          your engagement with anyone outside the people working on it, except where we are legally
          required to.
        </p>
      </Clause>

      <Clause heading="Limits of liability">
        <p>
          We are liable for the work we perform, up to the amount you paid us for the service in
          question. We are not liable for indirect or consequential losses — lost profit, lost
          opportunity, penalties arising from filings or decisions that were yours to make, or
          losses caused by information we were not given or were given incorrectly.
        </p>
        <p>Nothing here limits liability that cannot lawfully be limited.</p>
      </Clause>

      <Clause heading="Suspension and termination">
        <p>
          Either side can end an engagement in writing. On termination you are invoiced for work
          performed to that point and we hand over everything produced, along with your records, in
          a usable format.
        </p>
        <p>
          We may suspend or close an account for non-payment, or for use of our services to do
          something unlawful.
        </p>
      </Clause>

      <Clause heading="Changes to these terms">
        <p>
          When these terms change we update this page and the date at the top of it. Work already
          underway continues on the terms it started under.
        </p>
      </Clause>
    </LegalLayout>
  );
}
