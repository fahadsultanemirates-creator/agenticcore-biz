-- Staged only. Apply after Fahad approves; never alters existing client/order tables.
create table public.bot_waitlist (
 id uuid primary key default gen_random_uuid(),
 created_at timestamptz not null default now(),
 name text not null check (char_length(name) between 1 and 120),
 email text not null check (char_length(email) between 3 and 254),
 business text not null check (char_length(business) between 1 and 180),
 needs text not null check (char_length(needs) between 10 and 2000),
 consent_at timestamptz not null,
 ip_hash text not null,
 notification_status text not null default 'pending' check (notification_status in ('pending','sent','failed')),
 notified_at timestamptz
);
create unique index bot_waitlist_email_unique on public.bot_waitlist (lower(email));
create index bot_waitlist_rate_window on public.bot_waitlist (ip_hash,created_at desc);
alter table public.bot_waitlist enable row level security;
revoke all on public.bot_waitlist from public,anon,authenticated;
grant select,insert,update on public.bot_waitlist to service_role;
comment on table public.bot_waitlist is 'AgenticCore Bot early-access interest only. No subscriptions or app accounts. Server-only access with RLS.';
