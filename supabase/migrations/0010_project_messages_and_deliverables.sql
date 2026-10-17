-- The two tables the five new dashboard areas need, and .biz never had.
--
-- Orders, Invoices and Account all read tables that already exist
-- (requests, billing, profiles). Messages and Files do not: there was
-- nowhere to put a word said about a project, and nowhere to put a
-- document handed over at the end of one.
--
-- MESSAGES. A project has a status and nothing else to say. When work
-- moves, the client finds out by noticing the status changed, or by
-- being told on Telegram -- outside the system, unlogged, and invisible
-- to anybody who comes to the dashboard to ask what is happening. The
-- thread is append-only on the client's side for the same reason an
-- invoice is: a record both parties rely on is one neither can quietly
-- rewrite.
--
-- DELIVERABLES. 0009 made the point that most .biz work happens INSIDE
-- the client's own systems -- their Drive folder, their Sheet, their
-- accounting software -- and that the deliverable is often that their
-- books are current rather than a file. That is still true, and
-- project_connections is still where that access is recorded. But
-- bookkeeping, payroll and compliance also produce documents a client
-- is entitled to keep: a monthly statement, a reconciliation, a filing,
-- a payroll summary. Those had no durable home, so they were changing
-- hands over chat, which is not a record anybody can come back to a
-- year later.
--
-- Both tables are owner-readable and admin-readable. A client can post a
-- message; a client cannot invent a deliverable.
--
-- Mirrors agenticcore-agency's 0015, with two deliberate differences:
-- this one also creates the storage bucket (on .agency that was made by
-- hand in the dashboard, so its schema is not reproducible from the
-- migrations), and it uses .biz's own is_current_user_admin(), added in
-- 0002.

create table public.project_messages (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects (id) on delete cascade,
  user_id uuid not null references public.profiles (id) on delete cascade,

  -- Who is speaking. 'system' is for status transitions written by a
  -- trigger or an edge function, so the thread reads as one history
  -- rather than two interleaved ones.
  author text not null check (author in ('client', 'team', 'system')),

  body text not null check (length(btrim(body)) between 1 and 5000),

  -- Set when the client has seen it. Null means unread, which is what
  -- the dashboard's badge counts.
  read_at timestamptz,

  created_at timestamptz not null default now()
);

create index on public.project_messages (project_id, created_at desc);
create index on public.project_messages (user_id) where read_at is null;

create table public.project_deliverables (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects (id) on delete cascade,
  user_id uuid not null references public.profiles (id) on delete cascade,

  label text not null check (length(btrim(label)) between 1 and 200),

  -- Exactly one of these. A deliverable is either a document we put in
  -- the private bucket, or a link to something living in the client's
  -- own systems -- the Sheet we keep current, the folder we file into.
  -- For .biz the second kind is the common one, which is why url exists.
  storage_path text,
  url text,

  -- Bytes, for the UI. Null for a link.
  size_bytes bigint check (size_bytes is null or size_bytes >= 0),
  content_type text,

  notes text check (notes is null or length(notes) <= 2000),

  created_at timestamptz not null default now(),

  constraint deliverable_has_exactly_one_location check (
    (storage_path is not null and url is null)
    or (storage_path is null and url is not null)
  )
);

create index on public.project_deliverables (project_id, created_at desc);

-- user_id is denormalised from projects so the policies can compare a
-- column instead of resolving a subquery per row. A convenience that can
-- disagree with the truth is a security hole, so this forces the two to
-- agree on every write -- without it, a client could file a row under
-- their own user_id against somebody else's project and read it back.
--
-- 0009 wrote this per-table as project_connections_owner_matches(). Two
-- more tables want the identical check, so this one is generic and both
-- new triggers share it. The 0009 function is left alone: rewriting a
-- working policy's trigger is not what this migration is for.
create or replace function public.project_child_owner_matches()
returns trigger
language plpgsql
security definer
set search_path to 'public'
as $$
declare
  owner uuid;
begin
  select user_id into owner from public.projects where id = new.project_id;
  if owner is null then
    raise exception 'No such project';
  end if;
  if owner <> new.user_id then
    raise exception 'Row must belong to the same client as its project';
  end if;
  return new;
end;
$$;

create trigger project_messages_owner_matches
before insert or update on public.project_messages
for each row execute function public.project_child_owner_matches();

create trigger project_deliverables_owner_matches
before insert or update on public.project_deliverables
for each row execute function public.project_child_owner_matches();

alter table public.project_messages enable row level security;
alter table public.project_deliverables enable row level security;

create policy "select_own_project_messages" on public.project_messages
  for select using (auth.uid() = user_id);

-- A client may post, but only as themselves and only as 'client'. They
-- cannot write a message that appears to come from the team or from the
-- system, which would let somebody manufacture a record of us agreeing
-- to something.
create policy "insert_own_client_messages" on public.project_messages
  for insert with check (auth.uid() = user_id and author = 'client');

-- Marking a message read is the only update a client gets. The column
-- guards that make that safe are in protect_message_content below: a
-- policy can say which ROWS are reachable, not which COLUMNS may move.
create policy "mark_own_messages_read" on public.project_messages
  for update using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "admin_all_project_messages" on public.project_messages
  for all using (public.is_current_user_admin())
  with check (public.is_current_user_admin());

-- Deliverables are read-only to the client. Nobody buys something by
-- inserting a row saying they received it.
create policy "select_own_project_deliverables" on public.project_deliverables
  for select using (auth.uid() = user_id);

create policy "admin_all_project_deliverables" on public.project_deliverables
  for all using (public.is_current_user_admin())
  with check (public.is_current_user_admin());

-- The body and author of an existing message must not change, whoever is
-- asking. The UPDATE policy above cannot express that, so the rule lives
-- in a trigger, the same way protect_profile_fields does in 0001.
create or replace function public.protect_message_content()
returns trigger
language plpgsql
set search_path to 'public'
as $$
begin
  if current_user in ('anon', 'authenticated') then
    new.body := old.body;
    new.author := old.author;
    new.project_id := old.project_id;
    new.user_id := old.user_id;
    new.created_at := old.created_at;
  end if;
  return new;
end;
$$;

create trigger protect_message_content
before update on public.project_messages
for each row execute function public.protect_message_content();

-- ============================================================
-- Bucket: deliverables (private). Same reasoning as
-- request-attachments in 0004 -- no "alter table storage.objects enable
-- row level security" here, because Supabase enables it by default and
-- storage.objects is owned by supabase_storage_admin rather than the
-- role a SQL Editor session runs as, so re-issuing that ALTER fails
-- with "must be owner of table objects". CREATE POLICY does not require
-- ownership.
--
-- Note the difference from request-attachments: that bucket keys access
-- off the first path segment being the caller's uid, because the client
-- is the one uploading. Here the client never uploads, so the path
-- carries no uid to check. Access is granted by the deliverable row
-- that points at the object instead, which is also what stops a client
-- reading a file whose row was later reassigned.
-- ============================================================

insert into storage.buckets (id, name, public)
values ('deliverables', 'deliverables', false)
on conflict (id) do nothing;

create policy "read_own_deliverable_files"
  on storage.objects for select
  using (
    bucket_id = 'deliverables'
    and exists (
      select 1 from public.project_deliverables d
      where d.storage_path = storage.objects.name
        and d.user_id = auth.uid()
    )
  );

create policy "admin_all_deliverable_files"
  on storage.objects for all
  using (bucket_id = 'deliverables' and public.is_current_user_admin())
  with check (bucket_id = 'deliverables' and public.is_current_user_admin());

comment on table public.project_messages is
  'Per-project thread between client and team. Client may post as author '
  '''client'' and mark messages read; body and author are immutable after '
  'insert, enforced by protect_message_content.';

comment on table public.project_deliverables is
  'Documents handed to a client: a file in the private deliverables '
  'bucket, or a link to something in the client''s own systems. '
  'Client-readable, owner-written. Ongoing access to a client system is '
  'recorded in project_connections instead.';
