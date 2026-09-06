-- AgenticCore Biz — core dashboard schema. Adapted from AgenticCore
-- Agency's proven schema (profiles/requests/projects/billing/
-- points_transactions, referral crediting, Business Pool threshold),
-- written as a single clean migration rather than replaying Agency's
-- incremental bugfix history, since this is a greenfield project.
--
-- Deliberately excludes for now (added in later migrations, matching
-- their own PRs): is_admin + admin RPCs, request attachments, PayRam
-- columns, and the AI bot tables -- none of those are needed for the
-- schema to be internally correct and usable on its own.
--
-- Run once via Supabase Dashboard > SQL Editor (or `supabase db push`).

-- ============================================================
-- Generic updated_at trigger, reused across tables below.
-- ============================================================

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- ============================================================
-- profiles: one row per auth.users row (created by handle_new_user
-- below, never inserted directly by a client). total_spend/
-- is_business_pool/points_balance/referral_code/referred_by are all
-- system-maintained -- protect_profile_fields blocks client writes to
-- them below.
-- ============================================================

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text,
  company_name text,
  referral_code text unique not null,
  referred_by uuid references public.profiles(id) on delete set null,
  total_spend numeric(12,2) not null default 0,
  is_business_pool boolean not null default false,
  points_balance numeric(12,2) not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger set_profiles_updated_at
before update on public.profiles
for each row execute function public.set_updated_at();

-- ============================================================
-- requests: a client's submitted plan, single-tier (no low/mid/high --
-- .biz scopes one standard plan per client, unlike .agency). Created
-- by the client (via New Request, added in a later PR); agreed_price
-- is set during scoping, before payment.
-- ============================================================

create table public.requests (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  service_category text not null,
  task_type text not null,
  description text not null,
  agreed_price numeric(12,2),
  status text not null default 'draft' check (status in ('draft', 'awaiting_payment', 'confirmed')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger set_requests_updated_at
before update on public.requests
for each row execute function public.set_updated_at();

-- ============================================================
-- projects: created only via an admin RPC once a request is confirmed
-- (added in the admin panel PR) -- no client INSERT policy, by design,
-- same as .agency. revisions_used is capped at 2 from the start
-- (.agency added this constraint later; no reason not to have it be
-- correct immediately here).
-- ============================================================

create table public.projects (
  id uuid primary key default gen_random_uuid(),
  request_id uuid not null references public.requests(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  project_name text not null,
  status text not null default 'in_progress' check (status in ('in_progress', 'awaiting_review', 'revision_requested', 'delivered', 'approved')),
  revisions_used int not null default 0 check (revisions_used between 0 and 2),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger set_projects_updated_at
before update on public.projects
for each row execute function public.set_updated_at();

-- ============================================================
-- billing: one row per payment. project_id is nullable because an
-- upfront payment happens before a project exists (request_id column
-- for that case is added in the PayRam PR, matching .agency's own
-- incremental pattern).
-- ============================================================

create table public.billing (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  project_id uuid references public.projects(id) on delete set null,
  amount numeric(12,2) not null,
  payment_type text not null check (payment_type in ('upfront', 'milestone', 'full')),
  status text not null default 'pending' check (status in ('pending', 'paid', 'refunded')),
  paid_at timestamptz,
  created_at timestamptz not null default now()
);

-- ============================================================
-- points_transactions: ledger of AgenticCore Points earned (referral
-- credit today; redemption support can be added later without
-- changing this shape).
-- ============================================================

create table public.points_transactions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  type text not null,
  amount numeric(12,2) not null,
  source_project_id uuid references public.projects(id) on delete set null,
  referral_tier int,
  task_number int,
  created_at timestamptz not null default now()
);

-- ============================================================
-- generate_referral_code(): short, unique, human-shareable code.
-- Retries on the (very unlikely) collision rather than trusting
-- randomness alone.
-- ============================================================

create or replace function public.generate_referral_code()
returns text
language plpgsql
as $$
declare
  chars text := 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; -- no 0/O/1/I, avoids ambiguity
  code text;
  exists_already boolean;
begin
  loop
    code := '';
    for i in 1..7 loop
      code := code || substr(chars, floor(random() * length(chars) + 1)::int, 1);
    end loop;
    select exists(select 1 from public.profiles where referral_code = code) into exists_already;
    exit when not exists_already;
  end loop;
  return code;
end;
$$;

-- ============================================================
-- handle_new_user(): creates the profiles row on signup, resolving
-- referred_by from the referral code passed in auth signup metadata
-- (see auth.js: options.data.referred_by).
-- ============================================================

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  referrer_id uuid;
  ref_code text;
begin
  ref_code := new.raw_user_meta_data ->> 'referred_by';
  if ref_code is not null then
    select id into referrer_id from public.profiles where referral_code = ref_code;
  end if;

  insert into public.profiles (id, full_name, company_name, referral_code, referred_by)
  values (
    new.id,
    new.raw_user_meta_data ->> 'full_name',
    new.raw_user_meta_data ->> 'company_name',
    public.generate_referral_code(),
    referrer_id
  );

  return new;
end;
$$;

create trigger on_auth_user_created
after insert on auth.users
for each row execute function public.handle_new_user();

-- ============================================================
-- protect_profile_fields(): blocks a client from writing to
-- system-maintained columns directly. is_admin will be added to this
-- guard in the admin panel migration, once that column exists.
-- ============================================================

create or replace function public.protect_profile_fields()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  if current_user in ('anon', 'authenticated') then
    new.total_spend := old.total_spend;
    new.is_business_pool := old.is_business_pool;
    new.points_balance := old.points_balance;
    new.referral_code := old.referral_code;
    new.referred_by := old.referred_by;
  end if;
  return new;
end;
$$;

create trigger protect_profiles_fields
before update on public.profiles
for each row execute function public.protect_profile_fields();

-- ============================================================
-- handle_billing_paid(): fires when a billing row is marked paid.
-- Combines the Business Pool threshold ($5,000, matching
-- agenticcore.agency) and the 3-level referral crediting (20% / 10% /
-- 5%, plus 10% back to the paying client themselves if they were
-- referred), on a project's first paid billing row only -- ported
-- directly from .agency's proven trigger.
-- ============================================================

create or replace function public.handle_billing_paid()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  is_first_payment_for_project boolean;
  qualifying_task_number int;
  l1_id uuid;
  l2_id uuid;
  l3_id uuid;
  l1_share numeric(12,2);
  l2_share numeric(12,2);
  l3_share numeric(12,2);
  referred_share numeric(12,2);
begin
  if new.status = 'paid' and (tg_op = 'INSERT' or old.status is distinct from 'paid') then
    update public.profiles
    set total_spend = total_spend + new.amount,
        is_business_pool = is_business_pool or (total_spend + new.amount) >= 5000
    where id = new.user_id;

    if new.project_id is not null then
      select not exists (
        select 1 from public.billing
        where project_id = new.project_id and status = 'paid' and id <> new.id
      ) into is_first_payment_for_project;

      if is_first_payment_for_project then
        select count(distinct project_id) into qualifying_task_number
        from public.billing
        where user_id = new.user_id and status = 'paid' and project_id is not null;

        if qualifying_task_number <= 3 then
          select referred_by into l1_id from public.profiles where id = new.user_id;

          if l1_id is not null then
            referred_share := round(new.amount * 0.10, 2);
            insert into public.points_transactions
              (user_id, type, amount, source_project_id, referral_tier, task_number)
            values
              (new.user_id, 'earned_referral', referred_share, new.project_id, null, qualifying_task_number);
            update public.profiles set points_balance = points_balance + referred_share where id = new.user_id;

            l1_share := round(new.amount * 0.20, 2);
            insert into public.points_transactions
              (user_id, type, amount, source_project_id, referral_tier, task_number)
            values
              (l1_id, 'earned_referral', l1_share, new.project_id, 1, qualifying_task_number);
            update public.profiles set points_balance = points_balance + l1_share where id = l1_id;

            select referred_by into l2_id from public.profiles where id = l1_id;
            if l2_id is not null then
              l2_share := round(new.amount * 0.10, 2);
              insert into public.points_transactions
                (user_id, type, amount, source_project_id, referral_tier, task_number)
              values
                (l2_id, 'earned_referral', l2_share, new.project_id, 2, qualifying_task_number);
              update public.profiles set points_balance = points_balance + l2_share where id = l2_id;

              select referred_by into l3_id from public.profiles where id = l2_id;
              if l3_id is not null then
                l3_share := round(new.amount * 0.05, 2);
                insert into public.points_transactions
                  (user_id, type, amount, source_project_id, referral_tier, task_number)
                values
                  (l3_id, 'earned_referral', l3_share, new.project_id, 3, qualifying_task_number);
                update public.profiles set points_balance = points_balance + l3_share where id = l3_id;
              end if;
            end if;
          end if;
        end if;
      end if;
    end if;
  end if;
  return new;
end;
$$;

create trigger on_billing_paid
after insert or update on public.billing
for each row execute function public.handle_billing_paid();

-- ============================================================
-- Row Level Security. Every table owner-scoped to auth.uid() = user_id
-- (profiles: auth.uid() = id). projects and points_transactions have
-- no client INSERT policy at all -- both are written only by trusted
-- server-side contexts (an admin RPC, and the SECURITY DEFINER trigger
-- above, respectively), same as .agency.
-- ============================================================

alter table public.profiles enable row level security;
alter table public.requests enable row level security;
alter table public.projects enable row level security;
alter table public.billing enable row level security;
alter table public.points_transactions enable row level security;

create policy "select_own_profile" on public.profiles
  for select using (auth.uid() = id);

create policy "update_own_profile" on public.profiles
  for update using (auth.uid() = id);

create policy "select_own_requests" on public.requests
  for select using (auth.uid() = user_id);

create policy "insert_own_requests" on public.requests
  for insert with check (auth.uid() = user_id);

create policy "update_own_requests" on public.requests
  for update using (auth.uid() = user_id);

create policy "select_own_projects" on public.projects
  for select using (auth.uid() = user_id);

create policy "select_own_billing" on public.billing
  for select using (auth.uid() = user_id);

create policy "select_own_points_transactions" on public.points_transactions
  for select using (auth.uid() = user_id);
