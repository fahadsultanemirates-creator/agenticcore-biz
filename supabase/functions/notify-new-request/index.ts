// AgenticCore Biz — sends the account owner an immediate Telegram DM
// when a client submits the dashboard's self-serve New Request form.
// The request row itself is written directly by the client
// (public.requests has its own insert_own_requests RLS policy from
// migration 0001) -- this function exists only because sending a
// Telegram message needs the bot token, which can never reach the
// browser. Mirrors bot-core.ts's notifyOwnerOfHandoff so a request
// submitted through this form reaches the owner the same way a
// Forge/Telegram discovery handoff does, even though it's a
// deliberately separate, non-conversational pipeline (requests +
// admin.html's existing Pending requests / Create Project flow, not
// manager_tasks -- there's no AI conversation here for that
// machinery to judge).
//
// Authenticated + ownership-checked: resolves the caller's real
// identity from their own Authorization header (same pattern as
// forge-chat/payram-create-payment) and verifies the referenced
// request actually belongs to them, so this can't be used to spam the
// owner's Telegram about arbitrary/fabricated request ids.

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SUPABASE_ANON_KEY = Deno.env.get('SUPABASE_ANON_KEY')!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const TELEGRAM_BOT_TOKEN = Deno.env.get('TELEGRAM_BOT_TOKEN') || undefined;
const OWNER_TELEGRAM_ID = Deno.env.get('OWNER_TELEGRAM_ID') || undefined;

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS'
};

const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' }
  });
}

// Same pattern as forge-chat/payram-create-payment -- resolves the
// caller's real identity from their own Authorization header via a
// narrowly scoped client, rather than trusting anything the request
// body says.
async function resolveCaller(authHeader: string): Promise<{ id: string } | null> {
  const callerClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    global: { headers: { Authorization: authHeader } }
  });
  const { data, error } = await callerClient.auth.getUser();
  if (error || !data?.user) return null;
  return { id: data.user.id };
}

export async function handleRequest(req: Request): Promise<Response> {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: CORS_HEADERS });
  }

  if (req.method !== 'POST') {
    return jsonResponse({ error: 'Method not allowed' }, 405);
  }

  const authHeader = req.headers.get('Authorization');
  if (!authHeader) {
    return jsonResponse({ error: 'Missing Authorization header' }, 401);
  }

  const caller = await resolveCaller(authHeader);
  if (!caller) {
    return jsonResponse({ error: 'Not authenticated' }, 401);
  }

  let body: any;
  try {
    body = await req.json();
  } catch {
    return jsonResponse({ error: 'Invalid JSON body' }, 400);
  }

  const { requestId } = body || {};
  if (typeof requestId !== 'string' || !requestId) {
    return jsonResponse({ error: 'Missing requestId' }, 400);
  }

  const { data: request, error: requestError } = await supabaseAdmin
    .from('requests')
    .select('id, user_id, service_category, task_type, description')
    .eq('id', requestId)
    .single();

  if (requestError || !request) {
    return jsonResponse({ error: 'Request not found' }, 404);
  }

  if (request.user_id !== caller.id) {
    return jsonResponse({ error: 'Not authorized' }, 403);
  }

  // Best-effort, same as notifyOwnerOfHandoff in bot-core.ts -- a
  // failure here must not turn into an error for the client, who
  // already has their request safely recorded either way.
  if (TELEGRAM_BOT_TOKEN && OWNER_TELEGRAM_ID) {
    let ownerLabel = caller.id;
    try {
      const { data: userData } = await supabaseAdmin.auth.admin.getUserById(caller.id);
      if (userData?.user?.email) ownerLabel = userData.user.email;
    } catch (err) {
      console.error('notify-new-request: getUserById failed:', err);
    }

    const text = `📥 New request from the dashboard (${ownerLabel})\n\nInterested in: ${request.service_category} — ${request.task_type}\n\n${request.description}`;

    try {
      const resp = await fetch(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ chat_id: Number(OWNER_TELEGRAM_ID), text })
      });
      if (!resp.ok) {
        const errText = await resp.text().catch(() => '');
        console.error(`notify-new-request: sendMessage failed (${resp.status}):`, errText.slice(0, 500));
      }
    } catch (err) {
      console.error('notify-new-request: Telegram send failed:', err);
    }
  }

  return jsonResponse({ ok: true });
}

Deno.serve(handleRequest);
