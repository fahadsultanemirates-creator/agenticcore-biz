-- Where a .biz project's work actually happens.
--
-- .click and .agency deliver files: you order a logo, you download a logo,
-- and the project page is a shelf of finished things. .biz does not work
-- like that. Bookkeeping, invoicing, payroll trackers, CRM records and
-- back-office support are all performed INSIDE the client's own systems --
-- their Drive folder, their Sheet, their accounting software. There is
-- usually nothing to download at all; the deliverable is that their books
-- are current.
--
-- So a project needs to record the places we have been given access to, and
-- the state of that access. That is what this table is. It holds no
-- credentials: a `location` is a share link or an account identifier that
-- the client has already granted access to out of band. Storing an OAuth
-- token would mean holding the keys to a client's accounting system, which
-- is a liability this product does not need and this schema will not take.

create table public.project_connections (
  id uuid primary key default gen_random_uuid(),

  project_id uuid not null references public.projects (id) on delete cascade,

  -- Denormalised from projects deliberately. Every row-level policy below
  -- needs the owner, and resolving it through a subquery on projects for
  -- each row is both slower and easier to get wrong than comparing a column.
  -- The trigger further down guarantees it matches the project.
  user_id uuid not null references auth.users (id) on delete cascade,

  -- Shape, not membership. Which providers we support is the application's
  -- list (src/data/connections.ts) and it will grow; a CHECK enumerating
  -- them here would be a second copy of that list, which is exactly how
  -- package_subscriptions.package_key ended up blocking every package the
  -- site sells. See migration 0008.
  provider text not null check (provider ~ '^[a-z][a-z0-9_-]{1,38}[a-z0-9]$'),

  -- What this is, in the client's words: "2025 receipts", "payroll sheet".
  label text not null check (length(btrim(label)) between 1 and 120),

  -- A share link, folder path, or account reference. Never a secret.
  location text check (location is null or length(btrim(location)) <= 2048),

  -- How access was granted, for whoever picks the work up later.
  notes text check (notes is null or length(notes) <= 2000),

  -- requested: we have asked for access. connected: we have it and are
  -- working. revoked: access was withdrawn or the engagement ended.
  -- A status is part of this schema's contract rather than a catalogue of
  -- sellable things, so enumerating it here is right where enumerating
  -- providers was not.
  status text not null default 'requested'
    check (status in ('requested', 'connected', 'revoked')),

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index on public.project_connections (project_id, status);
create index on public.project_connections (user_id);

create trigger set_project_connections_updated_at
before update on public.project_connections
for each row execute function public.set_updated_at();

-- user_id is a convenience, and a convenience that can disagree with the
-- truth is a security hole: a client could insert a row carrying their own
-- user_id against somebody else's project_id, satisfy the policy below, and
-- read it back. This forces the two to agree, server-side, on every write.
create or replace function public.project_connections_owner_matches()
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
    raise exception 'A connection must belong to the same client as its project';
  end if;

  return new;
end;
$$;

create trigger project_connections_owner_matches
before insert or update on public.project_connections
for each row execute function public.project_connections_owner_matches();

alter table public.project_connections enable row level security;

create policy "select_own_project_connections" on public.project_connections
  for select using (auth.uid() = user_id);

create policy "insert_own_project_connections" on public.project_connections
  for insert with check (auth.uid() = user_id);

create policy "update_own_project_connections" on public.project_connections
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "delete_own_project_connections" on public.project_connections
  for delete using (auth.uid() = user_id);

create policy "admin_select_all_project_connections" on public.project_connections
  for select using (public.is_current_user_admin());

comment on table public.project_connections is
  'Cloud locations a client has given us access to for a project -- Drive '
  'folders, Sheets, accounting software. Holds share links and notes, never '
  'credentials or OAuth tokens.';
