# Biz pre-build inventory — 6 November 2026

Production source confirmed against Netlify deploy: 32deedfa56e6c686dc716a406cf7053b7b3865b7. Agency production: 678fdba59a166a12827b580db3201c8d8e1a968a. No production writes.

## Services

|ID|Service|URL|Price|Turnaround|Status|
|---|---|---|---|---|---|
|BIZ-01|Startup Roadmap & Business Action Plan|https://agenticcore.biz/services/BIZ-01|$25|2–4 working days|active|
|BIZ-02|Business Feasibility & Market-Fit Report|https://agenticcore.biz/services/BIZ-02|$39|4–7 working days|active|
|BIZ-03|Market & Competitor Research|https://agenticcore.biz/services/BIZ-03|$29|3–5 working days|active|
|BIZ-04|Business Registration Preparation Checklist|https://agenticcore.biz/services/BIZ-04|$19|2–4 working days|archived|
|BIZ-05|Business Administration Starter System|https://agenticcore.biz/services/BIZ-05|$39|3–5 working days|active|
|BIZ-06|Standard Operating Procedures Pack|https://agenticcore.biz/services/BIZ-06|$29|3–5 working days|active|
|BIZ-07|Invoicing, Quotations & Receipts Setup|https://agenticcore.biz/services/BIZ-07|$19|2–3 working days|active|
|BIZ-08|Expense & Cash-Flow Tracking System|https://agenticcore.biz/services/BIZ-08|$29|2–4 working days|active|
|BIZ-09|Payroll Administration Tracker|https://agenticcore.biz/services/BIZ-09|$29|2–4 working days|archived|
|BIZ-10|Bookkeeping Setup or Basic Cleanup|https://agenticcore.biz/services/BIZ-10|from $49|Scope-dependent — confirmed on quotation|archived|
|BIZ-11|Monthly Basic Bookkeeping Assistance|https://agenticcore.biz/services/BIZ-11|$59/month|Within the service month|archived|
|BIZ-12|Monthly Financial & KPI Reports|https://agenticcore.biz/services/BIZ-12|$29/month|Within the service month|archived|
|BIZ-13|Business Proposals & Professional Documents|https://agenticcore.biz/services/BIZ-13|from $25|Scope-dependent — confirmed on quotation|active|
|BIZ-14|CRM Customer Records & Pipeline Setup|https://agenticcore.biz/services/BIZ-14|$39|3–5 working days|active|
|BIZ-15|AI-Assisted Virtual Back-Office Support|https://agenticcore.biz/services/BIZ-15|$99/month|Ongoing, within the service month|archived|
|BIZ-16|Lead Research & Follow-Up Management|https://agenticcore.biz/services/BIZ-16|$79/month|Ongoing, within the service month|archived|
|BIZ-17|Managed Social Media Marketing|https://agenticcore.biz/services/BIZ-17|$99/month|Ongoing, within the service month|archived|
|BIZ-18|Advertising Campaign Management|https://agenticcore.biz/services/BIZ-18|$79/month|Ongoing, within the service month|archived|
|BIZ-19|Email Campaign Management|https://agenticcore.biz/services/BIZ-19|$49/month|Ongoing, within the service month|archived|

## Packages

PKG-LAUNCH-KIT: Business Launch Kit, $69. URL https://agenticcore.biz/packages#PKG-LAUNCH-KIT. Turnaround: TODO Fahad — no package-wide timeline published. Includes: Startup roadmap and business action plan; Concise competitor snapshot; Basic invoice, quotation and receipt templates; Administrative workflow starter guide; Business launch checklist; One revision round on the combined package. Excludes: Company incorporation; Legal or tax advice; A custom website — a quick one is AgenticCore.click, a professional one is AgenticCore.agency; Complete bookkeeping; Ongoing business management.

## Ordering and tables

All active service detail pages link to /create-project?q=… (local brief with mailto handoff, no database order). Signed-in /request/:id writes requests (user_id, service_category, task_type, description); agreed_price stays null and default status is draft pending scoping. Each service uses this same path. No services table. Two-payment terms: 30% upfront, 70% on completion; quotes must be agreed for starting prices. USDT on BNB Smart Chain and AC Token discount 10%.

Accounts: 6 auth.users and 6 profiles. Requests: 2 drafts; projects: 0; billing: 0; project_deliverables: 0; framework_payment_invoices: 0; storage objects: 0. These are point-in-time counts, not a claim that every registered account is a paying client. Email/password Supabase Auth, /login and /reset, separate from Agency accounts.

Dashboard reads requests, projects, billing, package_subscriptions; account uses profiles; project work uses project_connections, project_messages and project_deliverables; private files use deliverables bucket. Operations use manager_tasks, framework_events, framework_bridge_access and framework_payment_invoices. Existing order/payment records will not be moved or rewritten.

## Every React page route

- https://agenticcore.biz/
- https://agenticcore.biz/services
- https://agenticcore.biz/services/:id
- https://agenticcore.biz/packages
- https://agenticcore.biz/create-project
- https://agenticcore.biz/maya
- https://agenticcore.biz/forge
- https://agenticcore.biz/login
- https://agenticcore.biz/signup
- https://agenticcore.biz/reset
- https://agenticcore.biz/terms
- https://agenticcore.biz/privacy
- https://agenticcore.biz/contact
- https://agenticcore.biz/dashboard
- https://agenticcore.biz/dashboard/request/:id
- https://agenticcore.biz/projects
- https://agenticcore.biz/projects/:id
- https://agenticcore.biz/orders
- https://agenticcore.biz/messages
- https://agenticcore.biz/invoices
- https://agenticcore.biz/files
- https://agenticcore.biz/account
- https://agenticcore.biz*

## Remaining static HTML pages

- https://agenticcore.biz/admin.html
- https://agenticcore.biz/business-pool.html
- https://agenticcore.biz/how-it-works.html
- https://agenticcore.biz/legacy-landing.html
- https://agenticcore.biz/real-estate.html
- https://agenticcore.biz/referral.html

## Archived legacy services (remain unavailable)

- LEGACY-CHATBOT: AI Chatbot / Website Assistant — Retired. Conversational build work is AgenticCore.agency.
- LEGACY-VOICE: AI Voice Agent (Phone Answering) — Retired. Voice agent build work is AgenticCore.agency.
- LEGACY-REPUTATION: AI Reputation & Review Management — Retired.
- LEGACY-SOCIAL: AI Social Media Management — Continues as Managed Social Media Marketing.
- LEGACY-SEO: AI SEO Content & Optimization — Retired as a standing service.
- LEGACY-COPY: AI Website & Landing Page Copy — Retired. Page copy belongs with the site build at AgenticCore.agency.
- LEGACY-VIDEO: AI Short-Form Video Ads (UGC-style) — Retired. Single videos are AgenticCore.click.
- LEGACY-LEADGEN: AI Lead Generation & Outreach — Continues as Lead Research & Follow-Up Management.
- LEGACY-PPC: AI-Assisted PPC / Ad Management — Continues as Advertising Campaign Management.
- LEGACY-EMAIL: AI Email Marketing Automation — Continues as Email Campaign Management.
- LEGACY-ANALYTICS: AI Marketing Analytics Dashboard — Continues as Monthly Financial & KPI Reports.
- LEGACY-CRO: AI Conversion Rate Optimization (CRO) & A/B Testing — Retired.

## Existing-client recommendation — owner decision pending

Keep Biz /login, /reset, /dashboard, /orders, /projects/*, /invoices, /messages, /files and /account on the existing backend. Add Existing client orders entry on the bot landing page. This avoids password/account migration and keeps historical links valid. Do not redirect order or recovery URLs. No account migration without Fahad choosing it.

## Backup

Private logical snapshot saved before code changes: all 17 public table datasets, auth users and identities, schema columns/constraints/policies/public function definitions, and storage object metadata. No storage objects exist. This is a logical recovery snapshot, not a physical Postgres/PITR backup. Do not put this sensitive snapshot in Git.
