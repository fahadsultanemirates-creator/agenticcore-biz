-- AgenticCore Biz — closes the gap between "client submits a request"
-- and "client can pay for it", and locks down the columns that gap
-- exposed.
--
-- Until now there was no supported way to price a request. The client
-- writes a row via insert_own_requests (0001) as status='draft' with
-- agreed_price null; dashboard.js only renders a payment CTA for
-- status='awaiting_payment' AND a non-null agreed_price. Nothing in
-- admin.html, and no admin_* RPC in 0002, could set either -- and RLS
-- gave admins SELECT on requests but no UPDATE at all. The only way
-- through was hand-editing rows in the Supabase table editor, so the
-- whole payment path was unreachable from the product itself.
--
-- The obvious-looking fix -- "just let the client's own
-- update_own_requests policy handle it" -- is exactly the hole being
-- closed below: that policy is `for update using (auth.uid() =
-- user_id)` with no WITH CHECK and no column guard, so a client could
-- set their own agreed_price to 0.01 and flip their own status to
-- 'awaiting_payment' (or straight to 'confirmed', skipping payment
-- entirely). profiles has had protect_profile_fields guarding exactly
-- this class of column since 0001; requests never got the equivalent.
--
-- Run once via Supabase Dashboard > SQL Editor (or `supabase db
-- push`), after 0001-0007.

-- ============================================================
-- protect_request_fields(): the requests-table counterpart to
-- protect_profile_fields. A client keeps ownership of the fields they
-- legitimately author (description, service_category, task_type,
-- attachment_path); everything commercial -- price, status, and the
-- PayRam bookkeeping columns -- is pinned to its existing value on any
-- update arriving as anon/authenticated.
--
-- Deliberately silent (pin the old value) rather than raising: the
-- client UI never tries to write these, so anything that hits this
-- guard is either a bug or an attack, and neither deserves a helpful
-- error message. Trusted contexts -- service_role (the edge functions)
-- and SECURITY DEFINER RPCs, which run as the function owner -- are
-- unaffected, which is what lets admin_set_request_price below and
-- payram-webhook keep working.
-- ============================================================

create or replace function public.protect_request_fields()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  if current_user in ('anon', 'authenticated') then
    new.agreed_price := old.agreed_price;
    new.status := old.status;
    new.payram_reference_id := old.payram_reference_id;
    new.payram_payment_url := old.payram_payment_url;
    new.user_id := old.user_id;
  end if;
  return new;
end;
$$;

drop trigger if exists protect_requests_fields on public.requests;

create trigger protect_requests_fields
before update on public.requests
for each row execute function public.protect_request_fields();

-- ============================================================
-- admin_set_request_price(): the supported way to scope a request.
-- Sets the agreed price and moves the request to 'awaiting_payment',
-- which is what makes the client's payment CTA appear.
--
-- Only valid from 'draft' or 'awaiting_payment' -- re-pricing an
-- already-'confirmed' request would mean the client paid 30% of one
-- number and owes 70% of a different one, so that is rejected rather
-- than silently allowed. Re-pricing a request that is still merely
-- awaiting payment IS allowed (scoping conversations change), but
-- clears any PayRam invoice already raised against the old amount so
-- a stale invoice can never be reused for a new price.
-- ============================================================

create or replace function public.admin_set_request_price(p_request_id uuid, p_agreed_price numeric)
returns public.requests
language plpgsql
security definer
set search_path = public
as $$
declare
  req public.requests;
begin
  if not public.is_current_user_admin() then
    raise exception 'Not authorized';
  end if;

  if p_agreed_price is null or p_agreed_price <= 0 then
    raise exception 'Agreed price must be greater than zero';
  end if;

  select * into req from public.requests where id = p_request_id;

  if req is null then
    raise exception 'Request not found';
  end if;

  if req.status not in ('draft', 'awaiting_payment') then
    raise exception 'Only a draft or awaiting-payment request can be priced (status: %)', req.status;
  end if;

  update public.requests
  set agreed_price = p_agreed_price,
      status = 'awaiting_payment',
      payram_reference_id = null,
      payram_payment_url = null
  where id = p_request_id
  returning * into req;

  return req;
end;
$$;

-- ============================================================
-- admin_confirm_request_payment(): marks a request paid when the
-- money arrived out-of-band -- which, with PayRam checkout switched
-- off in the dashboard, is every payment: a USDT (BEP20) transfer the
-- admin has verified on-chain.
--
-- Does exactly what payram-webhook does on a FILLED event (insert the
-- upfront billing row, then flip the request to 'confirmed'), in the
-- same order and with the same idempotency guard, so the two paths
-- can't diverge. Inserting billing BEFORE flipping status matters:
-- the idempotency check gates on status='confirmed', so flipping
-- first and failing the insert would strand a request marked paid
-- with no billing record.
--
-- p_amount defaults to the 30% upfront figure the dashboard quotes,
-- but is overridable -- an on-chain transfer rarely lands on the exact
-- cent, and the billing row should record what actually arrived.
-- ============================================================

create or replace function public.admin_confirm_request_payment(p_request_id uuid, p_amount numeric default null)
returns public.requests
language plpgsql
security definer
set search_path = public
as $$
declare
  req public.requests;
  paid_amount numeric(12,2);
begin
  if not public.is_current_user_admin() then
    raise exception 'Not authorized';
  end if;

  select * into req from public.requests where id = p_request_id;

  if req is null then
    raise exception 'Request not found';
  end if;

  if req.status = 'confirmed' then
    return req; -- already done; idempotent, same as the webhook
  end if;

  if req.status <> 'awaiting_payment' then
    raise exception 'Only a request awaiting payment can be confirmed (status: %)', req.status;
  end if;

  if req.agreed_price is null then
    raise exception 'This request has no agreed price yet';
  end if;

  paid_amount := round(coalesce(p_amount, req.agreed_price * 0.30), 2);

  if paid_amount <= 0 then
    raise exception 'Payment amount must be greater than zero';
  end if;

  if not exists (select 1 from public.billing where request_id = req.id) then
    insert into public.billing (user_id, request_id, amount, payment_type, status, paid_at)
    values (req.user_id, req.id, paid_amount, 'upfront', 'paid', now());
  end if;

  update public.requests set status = 'confirmed' where id = p_request_id
  returning * into req;

  return req;
end;
$$;

-- ============================================================
-- admin_create_project_from_request(): unchanged except for one added
-- precondition -- the request must actually be 'confirmed'. Without
-- it an admin could spin up a project (and with it the whole
-- delivery/revision/approve-and-pay-70% lifecycle) from a draft
-- nobody has paid a cent against, and approve_project_delivery (0004)
-- would then happily raise the remaining-70% bill on a request whose
-- upfront 30% never existed.
-- ============================================================

create or replace function public.admin_create_project_from_request(p_request_id uuid, p_project_name text)
returns public.projects
language plpgsql
security definer
set search_path = public
as $$
declare
  req public.requests;
  proj public.projects;
begin
  if not public.is_current_user_admin() then
    raise exception 'Not authorized';
  end if;

  select * into req from public.requests where id = p_request_id;

  if req is null then
    raise exception 'Request not found';
  end if;

  if req.status <> 'confirmed' then
    raise exception 'Only a confirmed (paid) request can become a project (status: %)', req.status;
  end if;

  if exists (select 1 from public.projects where request_id = p_request_id) then
    raise exception 'A project already exists for this request';
  end if;

  insert into public.projects (request_id, user_id, project_name, status)
  values (p_request_id, req.user_id, p_project_name, 'in_progress')
  returning * into proj;

  return proj;
end;
$$;

revoke all on function public.admin_set_request_price(uuid, numeric) from public;
grant execute on function public.admin_set_request_price(uuid, numeric) to authenticated;

revoke all on function public.admin_confirm_request_payment(uuid, numeric) from public;
grant execute on function public.admin_confirm_request_payment(uuid, numeric) to authenticated;
