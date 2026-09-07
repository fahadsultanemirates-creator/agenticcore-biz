-- AgenticCore Biz — discovery-first handoff records. Created by
-- bot-core.ts's createDiscoveryHandoff() once a widget/Forge/Telegram
-- conversation has gathered enough (new-or-existing business, goal,
-- basic qualifying info) to hand off to a human manager. Run once via
-- Supabase Dashboard > SQL Editor (or `supabase db push`), after
-- 0001-0005.
--
-- token is what actually travels in the client-facing handoff link
-- (https://t.me/<bot_username>?start=<token>) -- Telegram's deep-link
-- `start` parameter only allows [A-Za-z0-9_-] up to 64 chars, so the
-- free-text summary itself can never go in the URL. telegram-webhook
-- looks the token up when it receives "/start <token>" and uses the
-- stored summary to greet the person with context already in hand and
-- to notify OWNER_TELEGRAM_ID, rather than starting cold.
--
-- Same access pattern as bot_conversations/bot_messages/manager_tasks:
-- nothing browser-side ever queries this table directly, so RLS is
-- enabled with zero policies -- only service_role (used exclusively by
-- the Edge Functions) can read or write it.

create table public.discovery_handoffs (
  id uuid primary key default gen_random_uuid(),
  token text not null unique,
  channel text not null check (channel in ('widget', 'telegram', 'forge')),
  external_id text not null,
  summary text not null,
  consumed_at timestamptz,
  created_at timestamptz not null default now()
);

create index on public.discovery_handoffs (token) where consumed_at is null;

alter table public.discovery_handoffs enable row level security;
-- No policies: anon/authenticated get zero access.
