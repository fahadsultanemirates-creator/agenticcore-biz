-- AgenticCore Biz — recurring billing for the two fixed-price packages
-- (AI Starter Engine $950/mo, Omni-Scale Growth Engine $3,450/mo). The
-- Custom Package deliberately has no place here -- it's negotiated per
-- client and billed the same one-off way à la carte services already
-- are (an ordinary `billing` row, no subscription record).
--
-- This does NOT wire actual recurring charges through PayRam -- PayRam
-- is a one-time-invoice crypto gateway, not a subscription billing
-- API, and USDT has no "auto-charge" concept at all. What this adds is
-- the tracking layer both real payment paths still need regardless:
-- one row per active package per client, its monthly amount, and when
-- the next payment is due, so overdue accounts are a query away instead
-- of someone's memory. Collecting a given cycle's payment is still the
-- existing admin-driven flow (PayRam link or USDT, same as any other
-- billing row) -- an admin RPC just also advances next_due_date and
-- creates the billing row in the same step once that payment lands, so
-- there's a single confirmation step instead of the two turns getting
-- out of sync.
--
-- Run once via Supabase Dashboard > SQL Editor (or `supabase db push`),
-- after 0001-0006.

-- ============================================================
-- billing.payment_type: add 'recurring' for the billing rows this
-- migration's RPC creates. Existing values (upfront/milestone/full)
-- are untouched.
-- ============================================================

alter table public.billing drop constraint if exists billing_payment_type_check;
alter table public.billing add constraint billing_payment_type_check
  check (payment_type in ('upfront', 'milestone', 'full', 'recurring'));

-- ============================================================
-- package_subscriptions: one row per client per active package.
-- request_id is optional -- a subscription can exist ahead of (or
-- without) a formal request/project record, since package sign-up
-- today happens through the discovery-first Forge/Telegram
-- conversation rather than a self-serve New Request form. No client
-- INSERT/UPDATE policy: like projects and billing, this is written
-- only through the admin RPCs below, which independently re-verify
-- is_admin server-side.
-- ============================================================

create table public.package_subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  request_id uuid references public.requests(id) on delete set null,
  package_key text not null check (package_key in ('starter-engine', 'omni-scale-growth-engine')),
  monthly_amount numeric(12,2) not null,
  status text not null default 'active' check (status in ('active', 'paused', 'cancelled')),
  next_due_date date not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger set_package_subscriptions_updated_at
before update on public.package_subscriptions
for each row execute function public.set_updated_at();

create index on public.package_subscriptions (status, next_due_date);

alter table public.package_subscriptions enable row level security;

create policy "select_own_package_subscriptions" on public.package_subscriptions
  for select using (auth.uid() = user_id);

create policy "admin_select_all_package_subscriptions" on public.package_subscriptions
  for select using (public.is_current_user_admin());

-- ============================================================
-- admin_create_package_subscription: the only way a subscription row
-- can be created. p_first_due_date lets an admin backdate/forward-date
-- the first cycle to match whatever was actually agreed with the
-- client (e.g. "starts the 1st" vs "starts today").
-- ============================================================

create or replace function public.admin_create_package_subscription(
  p_user_id uuid,
  p_package_key text,
  p_monthly_amount numeric,
  p_first_due_date date,
  p_request_id uuid default null
)
returns public.package_subscriptions
language plpgsql
security definer
set search_path = public
as $$
declare
  sub public.package_subscriptions;
begin
  if not public.is_current_user_admin() then
    raise exception 'Not authorized';
  end if;

  insert into public.package_subscriptions (user_id, request_id, package_key, monthly_amount, next_due_date)
  values (p_user_id, p_request_id, p_package_key, p_monthly_amount, p_first_due_date)
  returning * into sub;

  return sub;
end;
$$;

-- ============================================================
-- admin_record_subscription_payment: confirms the current cycle was
-- paid (however it was actually collected -- PayRam link or USDT,
-- verified manually same as any other billing row) and advances
-- next_due_date by exactly one calendar month in the same step, so a
-- subscription can never end up with a paid cycle but a stale due
-- date or vice versa.
-- ============================================================

create or replace function public.admin_record_subscription_payment(p_subscription_id uuid)
returns public.package_subscriptions
language plpgsql
security definer
set search_path = public
as $$
declare
  sub public.package_subscriptions;
begin
  if not public.is_current_user_admin() then
    raise exception 'Not authorized';
  end if;

  select * into sub from public.package_subscriptions where id = p_subscription_id;

  if sub is null then
    raise exception 'Subscription not found';
  end if;

  insert into public.billing (user_id, request_id, amount, payment_type, status, paid_at)
  values (sub.user_id, sub.request_id, sub.monthly_amount, 'recurring', 'paid', now());

  update public.package_subscriptions
  set next_due_date = next_due_date + interval '1 month'
  where id = p_subscription_id
  returning * into sub;

  return sub;
end;
$$;

-- ============================================================
-- admin_update_subscription_status: pause/cancel/reactivate. Separate
-- from the payment RPC above so pausing a subscription never
-- accidentally implies a payment was recorded, or vice versa.
-- ============================================================

create or replace function public.admin_update_subscription_status(p_subscription_id uuid, p_new_status text)
returns public.package_subscriptions
language plpgsql
security definer
set search_path = public
as $$
declare
  sub public.package_subscriptions;
begin
  if not public.is_current_user_admin() then
    raise exception 'Not authorized';
  end if;

  update public.package_subscriptions set status = p_new_status where id = p_subscription_id
  returning * into sub;

  if sub is null then
    raise exception 'Subscription not found';
  end if;

  return sub;
end;
$$;

revoke all on function public.admin_create_package_subscription(uuid, text, numeric, date, uuid) from public;
grant execute on function public.admin_create_package_subscription(uuid, text, numeric, date, uuid) to authenticated;

revoke all on function public.admin_record_subscription_payment(uuid) from public;
grant execute on function public.admin_record_subscription_payment(uuid) to authenticated;

revoke all on function public.admin_update_subscription_status(uuid, text) from public;
grant execute on function public.admin_update_subscription_status(uuid, text) to authenticated;
