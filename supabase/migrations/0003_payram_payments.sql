-- AgenticCore Biz — PayRam payment gateway integration. Adapted from
-- AgenticCore Agency's proven PayRam migration/edge functions. Run once
-- via Supabase Dashboard > SQL Editor (or `supabase db push`), after
-- 0001 and 0002.
--
-- request_id lets a billing row reference the request it was raised
-- for before any project exists yet (the upfront payment happens at
-- request-confirmation time, ahead of admin creating the project).
-- payram_reference_id/payram_payment_url on requests make payment
-- creation idempotent -- if a client re-opens the checkout view, the
-- edge function reuses the existing invoice instead of creating a new
-- one each time.

alter table public.billing
  add column if not exists request_id uuid references public.requests(id) on delete set null;

alter table public.requests
  add column if not exists payram_reference_id text,
  add column if not exists payram_payment_url text;
