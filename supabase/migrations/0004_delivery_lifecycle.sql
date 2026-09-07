-- AgenticCore Biz — delivery lifecycle: client-side revision/approval
-- RPCs, plus the request-attachments storage bucket. Adapted directly
-- from AgenticCore Agency's proven migration. Run once via Supabase
-- Dashboard > SQL Editor (or `supabase db push`), after 0001-0003.
--
-- projects already has no client UPDATE policy (by design, from
-- 0001) and its status check constraint already includes
-- 'awaiting_review'/'revision_requested'/'delivered'/'approved' from
-- the start -- .biz's schema was written greenfield with the full
-- lifecycle in mind, so unlike .agency's own incremental history,
-- there's no constraint to widen here. What's missing is the two
-- narrow SECURITY DEFINER RPCs a client actually calls to move a
-- delivered project forward, each enforcing ownership, the
-- current-status precondition, and (for revisions) the 2-revision cap
-- server-side, atomically.

-- ============================================================
-- request_project_revision: the project owner spends one of their
-- (max 2) free revisions. Only valid from 'delivered'.
-- ============================================================

create or replace function public.request_project_revision(p_project_id uuid)
returns public.projects
language plpgsql
security definer
set search_path = public
as $$
declare
  proj public.projects;
begin
  select * into proj from public.projects where id = p_project_id;

  if proj is null then
    raise exception 'Project not found';
  end if;

  if proj.user_id <> auth.uid() then
    raise exception 'Not authorized';
  end if;

  if proj.status <> 'delivered' then
    raise exception 'Revisions can only be requested while a project is awaiting your review';
  end if;

  if proj.revisions_used >= 2 then
    raise exception 'No free revisions remaining -- further changes are billed separately';
  end if;

  update public.projects
  set status = 'revision_requested', revisions_used = revisions_used + 1
  where id = p_project_id
  returning * into proj;

  return proj;
end;
$$;

-- ============================================================
-- approve_project_delivery: the project owner approves delivered
-- work. Transitions to 'approved' and creates the remaining-70%
-- billing row (status 'pending') -- the 30% upfront row already
-- exists from when the request was confirmed via PayRam/USDT. An
-- admin later marks that row 'paid' once payment is actually
-- collected, which fires the existing total_spend/points/Business
-- Pool trigger logic from 0001 automatically -- and this time with
-- project_id set, so referral point crediting (deferred until now,
-- see 0003's PR notes) finally applies.
-- ============================================================

create or replace function public.approve_project_delivery(p_project_id uuid)
returns public.projects
language plpgsql
security definer
set search_path = public
as $$
declare
  proj public.projects;
  req public.requests;
  remaining_amount numeric(12,2);
begin
  select * into proj from public.projects where id = p_project_id;

  if proj is null then
    raise exception 'Project not found';
  end if;

  if proj.user_id <> auth.uid() then
    raise exception 'Not authorized';
  end if;

  if proj.status <> 'delivered' then
    raise exception 'Only a delivered project can be approved';
  end if;

  select * into req from public.requests where id = proj.request_id;

  if req.agreed_price is null then
    raise exception 'No agreed price on file for this project -- contact support';
  end if;

  remaining_amount := round(req.agreed_price * 0.70, 2);

  update public.projects set status = 'approved' where id = p_project_id
  returning * into proj;

  insert into public.billing (user_id, project_id, amount, payment_type, status)
  values (proj.user_id, proj.id, remaining_amount, 'milestone', 'pending');

  return proj;
end;
$$;

revoke all on function public.request_project_revision(uuid) from public;
grant execute on function public.request_project_revision(uuid) to authenticated;

revoke all on function public.approve_project_delivery(uuid) from public;
grant execute on function public.approve_project_delivery(uuid) to authenticated;

-- ============================================================
-- Bucket: request-attachments (private -- not publicly readable;
-- access is granted per-object via the RLS policies below). Schema
-- only for now -- the actual upload UI lives in the New Request form,
-- which lands in its own later PR once pricing is finalized. Adding
-- the bucket/column here rather than there keeps this PR's promised
-- scope (attachments + delivery lifecycle, per the roadmap) complete
-- even though the two pieces land in the UI at different times.
-- ============================================================

insert into storage.buckets (id, name, public)
values ('request-attachments', 'request-attachments', false)
on conflict (id) do nothing;

alter table public.requests
  add column if not exists attachment_path text;

-- No "alter table storage.objects enable row level security" here --
-- Supabase enables RLS on storage.objects by default in every
-- project, and storage.objects is owned by the internal
-- supabase_storage_admin role rather than the role a SQL Editor
-- session runs as, so re-issuing that ALTER TABLE fails with "must be
-- owner of table objects". CREATE POLICY itself doesn't require
-- ownership -- Supabase grants that separately -- so the policies
-- below still work without it.

create policy "request_attachments_insert_own"
  on storage.objects for insert
  with check (
    bucket_id = 'request-attachments'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy "request_attachments_select_own"
  on storage.objects for select
  using (
    bucket_id = 'request-attachments'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy "request_attachments_delete_own"
  on storage.objects for delete
  using (
    bucket_id = 'request-attachments'
    and (storage.foldername(name))[1] = auth.uid()::text
  );
