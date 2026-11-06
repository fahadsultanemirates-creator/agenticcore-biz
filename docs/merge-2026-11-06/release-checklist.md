# Release checklist — approval required

## Ready in preview branches
- Agency: nine active Biz services and Business Launch Kit added to existing nine active Agency services. Original Biz catalogue preserved verbatim as businessCatalog.ts; archived IDs stay unavailable. Existing Agency request/payment components retained. Imported Biz requests remain draft/unpriced for scope review, with 30%/70% terms after acceptance. Existing database triggers confirmed: owner request alert and shared framework event queue.
- Biz: new Bot landing with four SVG concept illustrations, Smart / Pro / Max (no prices), private-testing status, early-access form, existing client orders entry, service redirects, SEO/sitemap update. No bot app or app tables built. /app is reserved for the other developer.
- Group: Bot introduction on home and services pages, linking to Biz for future subscriptions; services routed to Agency.
- Click/AC Token: updated service referrals and product positioning.
- Pakistan repositories: no Biz URL references found; no modifications necessary.

## Existing-client decision
Recommendation: retain Biz login/order/history/delivery routes and backend. No migration has been performed. Fahad must approve this option or request a separate account migration plan before release.

## Database backup and safety
Private logical snapshot created before edits, stored privately outside Git. It includes all 17 public table datasets, auth users/identities and key public schema definitions. Storage has zero objects. Not a full physical/PITR backup. No production DDL, data writes, auth changes, order creation, payment creation or test notifications have been performed by this work.

## Approval and deployment sequence
1. Fahad approves previews, existing-client approach and missing Business Launch Kit timeline.
2. Deploy Agency first, including generated assistant catalogue/functions; verify business form with dedicated test account and test order, permissions, payment invoice and internal Telegram event end to end. This has not been run against production during preview preparation.
3. Apply the staged bot_waitlist migration; deploy bot-waitlist Edge Function. No existing table is altered. Set a fresh BOT_WAITLIST_HASH_SALT server secret. Existing TELEGRAM_BOT_TOKEN/OWNER_TELEGRAM_ID are reused. Allow exact approved preview origins only in BOT_WAITLIST_ALLOWED_ORIGINS when testing. Never expose secret values.
4. Test the new isolated waitlist: consent, validation, row privacy, duplicate handling, rate control, Telegram success/failure status. Set VITE_BOT_WAITLIST_ENABLED=true only after successful integration verification, then rebuild Biz. Until then, preview submissions do not transmit the form.
5. Deploy Biz only after Agency is working; apply its staged 301s and verify host-level redirects including queries and case variants. Retest existing Biz login/recovery/orders/invoices/files without changing historical records.
6. Deploy Group, Click and Token reference changes after both destination sites are ready. No changes to existing sent emails, messenger history or external bot company.md.

## Remaining verification
- All local builds and existing tests must pass before review.
- Source/generated-HTML link checks are provided. Public service URLs on Agency do not exist on production until release; cross-domain production HTTP checks must follow approval/deployment.
- Browser/mobile visual review pending: local browser executable was unavailable and automated browser download failed. Netlify preview access requires the existing team sign-in for Biz and Agency; access protections are unchanged.
- Waitlist SQL/function are staged, not applied or claimed live. No subscription pricing is invented.
- Production changes require Fahad approval. Do not merge these PRs automatically.
