import { Bullets, Clause, LegalLayout } from "./LegalLayout";

/**
 * Replaces public/privacy.html.
 *
 * The old file's structure was sound and most of it carried over. Three
 * things were wrong or missing:
 *
 *  - it offered "AC token" as a payment method, which this site does not
 *    take, and described running "social/marketing work" as the main reason
 *    it held customer material;
 *  - it said nothing about financial records, which is the most sensitive
 *    category this business handles -- bank lines, payroll, invoices;
 *  - it said nothing about access to customer systems, which is how most
 *    .biz services are actually performed (see migration 0009).
 *
 * The no-credentials guarantee below is not a promise bolted on afterwards.
 * project_connections has no column to put a secret in.
 */
export function Privacy() {
  return (
    <LegalLayout
      title="Privacy Policy"
      eyebrow="Your data"
      updated="October 2026"
      intro="What we collect, why we collect it, who else touches it, and what we will never ask you for."
    >
      <Clause heading="What we collect">
        <Bullets
          items={[
            "Account information — your email and password. Passwords are handled by our authentication provider; we never see or store your raw password.",
            "Business and project details — what you tell us about your business, the briefs you submit, and the materials you share for a service to be performed.",
            "Financial records — where you have engaged us for bookkeeping, payroll or reporting, the figures and documents you provide for that work: invoices, receipts, statements, payroll information.",
            "System access records — which of your systems we have been granted access to, what each one is for, and whether that access is active.",
            "Payment details — for USDT payments, the transaction hash and wallet address you share for manual verification. We do not process or store card numbers.",
            "Communications — messages through the dashboard, Telegram, WhatsApp or the on-site chat, so we can respond and keep a record of what was agreed.",
            "Referral activity — who referred you and who you have referred, so referral credit is applied correctly.",
            "Basic usage data — standard technical information such as browser type and access logs, collected automatically to keep the service running and secure.",
          ]}
        />
      </Clause>

      <Clause heading="What we never ask for">
        <p>
          <strong className="text-fg">Passwords and authentication codes for your own
          systems.</strong>{" "}
          Access is granted from your side — a shared folder, an invited user, a guest seat — and
          our systems have nowhere to put a credential even if one were sent to us. Anyone asking
          you for a password or a login code in our name is not us.
        </p>
      </Clause>

      <Clause heading="How we use it">
        <p>
          Strictly to run your engagement: scoping and performing the work you have asked for,
          verifying payment, applying referral credit, and communicating with you about your
          account. We do not use your information for anything beyond operating AgenticCore.biz.
        </p>
        <p>
          We do not sell your data, and we do not use your business figures or documents to train
          anything.
        </p>
      </Clause>

      <Clause heading="Who else processes it">
        <p>
          Only the providers needed to run the service, and only to the extent needed to run it:
        </p>
        <Bullets
          items={[
            "Supabase — database, authentication and file storage.",
            "Netlify — website hosting and delivery.",
            "Telegram — where you choose to contact us or receive notifications there.",
            "AI providers — where a service uses AI assistance, the material needed for that specific task. Your financial records are not sent anywhere they are not needed.",
          ]}
        />
        <p>Beyond these, we do not share your information with third parties.</p>
      </Clause>

      <Clause heading="How long we keep it">
        <p>
          Account and project data for as long as your account is active, and afterwards only as
          long as needed to meet legal, accounting or dispute-resolution obligations. Bookkeeping
          records are often subject to statutory retention periods in your own jurisdiction — where
          they are, we keep our copy for as long as that period requires and no longer.
        </p>
      </Clause>

      <Clause heading="Your choices">
        <p>
          You can ask for a copy of what we hold about you, ask us to correct it, or ask for your
          account and data to be deleted, at{" "}
          <a
            href="mailto:hello@agenticcore.biz"
            className="font-semibold text-orange-400 hover:underline"
          >
            hello@agenticcore.biz
          </a>
          . You can withdraw our access to any of your systems yourself, at any time, from your own
          account.
        </p>
      </Clause>

      <Clause heading="Security">
        <p>
          Your data is isolated at the database level: the rules are enforced by the database
          itself, so one customer's records cannot be read by another even through a flaw in the
          website. Files you upload are held in private storage — the bucket is not publicly
          readable, so an uploaded document cannot be reached by guessing or sharing a URL.
        </p>
      </Clause>
    </LegalLayout>
  );
}
