-- AgenticCore Biz — bot infrastructure backing the homepage widget, the
-- Telegram manager bot, and Forge (the dashboard's own project-intake
-- assistant). Adapted from AgenticCore Agency's proven schema (their
-- 0008 + 0011 + 0012 + 0013, combined here since .biz is greenfield and
-- all four land in the same PR). Run once via Supabase Dashboard > SQL
-- Editor (or `supabase db push`), after 0001-0004.
--
-- Nothing browser-side ever queries these tables directly (unlike
-- profiles/requests/projects/billing) -- every read/write goes through
-- an Edge Function using the service_role key, which bypasses RLS by
-- design. So these get RLS enabled with zero policies for
-- anon/authenticated.

-- ============================================================
-- bot_conversations: one row per (channel, external_id) pair.
-- external_id is the widget's localStorage-generated visitor_id for
-- 'widget', the Telegram chat_id (as text) for 'telegram', or the
-- authenticated user's own id for 'forge'. needs_human is sticky (set
-- true once, left true) so a later review pass can filter
-- "conversations that ever needed a human" rather than just the
-- current turn.
-- ============================================================

create table public.bot_conversations (
  id uuid primary key default gen_random_uuid(),
  channel text not null check (channel in ('widget', 'telegram', 'forge')),
  external_id text not null,
  user_id uuid references public.profiles(id) on delete set null,
  language text,
  needs_human boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (channel, external_id)
);

create trigger set_bot_conversations_updated_at
before update on public.bot_conversations
for each row execute function public.set_updated_at();

-- ============================================================
-- bot_messages: full transcript, flagged per-message for later review.
-- uncertain/handoff_triggered are set by the model's own structured
-- output (see supabase/functions/_shared/bot-core.ts), not inferred
-- after the fact.
-- ============================================================

create table public.bot_messages (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid not null references public.bot_conversations(id) on delete cascade,
  role text not null check (role in ('user', 'assistant')),
  content text not null,
  detected_language text,
  uncertain boolean not null default false,
  handoff_triggered boolean not null default false,
  created_at timestamptz not null default now()
);

create index on public.bot_messages (conversation_id, created_at);
create index on public.bot_messages (uncertain) where uncertain;
create index on public.bot_messages (handoff_triggered) where handoff_triggered;

alter table public.bot_conversations enable row level security;
alter table public.bot_messages enable row level security;
-- No policies: anon/authenticated get zero access. Only service_role
-- (used exclusively by the Edge Functions) can read/write these tables.

-- ============================================================
-- manager_tasks: lightweight task queue filed by the Telegram bot and
-- Forge (see supabase/functions/_shared/bot-core.ts's
-- createManagerTask) when a conversation describes something the
-- account owner should personally follow up on. public_id (e.g.
-- "AC-BIZ-0001") is generated in code, not by a Postgres sequence:
-- count existing rows for the brand, add one, pad to 4 digits.
-- draft_text holds the generated first draft (and any patched
-- revisions) from /approve and the inline draft-patch shortcut.
-- ============================================================

create table public.manager_tasks (
  id uuid primary key default gen_random_uuid(),
  public_id text not null unique,
  brand text not null default 'biz',
  channel text not null default 'telegram',
  external_id text,
  title text not null,
  task_type text not null default 'general',
  brief text,
  draft_text text,
  owner_notes text,
  status text not null default 'waiting_you'
    check (status in ('new', 'scoped', 'waiting_you', 'building', 'review', 'done', 'cancelled')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger set_manager_tasks_updated_at
before update on public.manager_tasks
for each row execute function public.set_updated_at();

alter table public.manager_tasks enable row level security;
-- No policies here either -- manager_tasks is an internal work queue for
-- the account owner, read/written only by the Edge Functions above via
-- service_role. No client (including the client who originated a task)
-- reads it directly.
