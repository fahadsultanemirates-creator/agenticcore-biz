// AgenticCore Biz — lists client-uploaded files in the private
// request-attachments bucket (schema/RLS from migration
// 0004_delivery_lifecycle.sql; the upload control itself landed in
// the Forge chat attachment PR) for the admin panel's "Client
// Attachments" section, with a short-lived signed download URL for
// each. Supabase Storage's own RLS only lets each client read their
// own folder (storage.foldername(name)[1] = auth.uid()::text) -- there
// is deliberately no admin SELECT policy on storage.objects, so this
// runs entirely through the service-role client instead, gated by its
// own is_admin check on the caller (same "trust nothing but our own
// server-side check" pattern as every admin_* RPC in 0002_admin_panel.sql).
//
// Storage is flat, not truly hierarchical: a bucket-root list() only
// returns the top-level "folders" (one per uploader's user id, per the
// {user_id}/{file} path scheme every attachment upload uses) that
// actually contain at least one object, so this is a two-level list
// (root, then each folder) rather than a single call.
//
// Authenticated + admin-checked: resolves the caller's real identity
// from their own Authorization header (same pattern as
// forge-chat/notify-new-request), then verifies profiles.is_admin
// server-side before touching the service-role storage client.

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SUPABASE_ANON_KEY = Deno.env.get('SUPABASE_ANON_KEY')!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

const BUCKET = 'request-attachments';
const SIGNED_URL_EXPIRY_SECONDS = 300;

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

async function resolveCaller(authHeader: string): Promise<{ id: string } | null> {
  const callerClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    global: { headers: { Authorization: authHeader } }
  });
  const { data, error } = await callerClient.auth.getUser();
  if (error || !data?.user) return null;
  return { id: data.user.id };
}

// Strips the "<timestamp>-" prefix every upload path segment has (see
// the Forge chat attachment control) for a human-readable filename;
// falls back to the raw object name if it doesn't match that shape.
function displayFilename(objectName: string): string {
  return objectName.replace(/^\d+-/, '') || objectName;
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

  const { data: profile, error: profileError } = await supabaseAdmin
    .from('profiles')
    .select('is_admin')
    .eq('id', caller.id)
    .single();

  if (profileError || !profile?.is_admin) {
    return jsonResponse({ error: 'Not authorized' }, 403);
  }

  const { data: profiles } = await supabaseAdmin.from('profiles').select('id, full_name');
  const nameByUserId = new Map((profiles || []).map((p: { id: string; full_name: string | null }) => [p.id, p.full_name]));

  const { data: topLevel, error: topLevelError } = await supabaseAdmin.storage.from(BUCKET).list('');
  if (topLevelError) {
    console.error('admin-list-attachments: listing bucket root failed:', topLevelError);
    return jsonResponse({ error: 'Failed to list attachments' }, 500);
  }

  const attachments: Array<{
    path: string;
    filename: string;
    uploaderId: string;
    uploaderName: string;
    uploadedAt: string | null;
    sizeBytes: number | null;
    downloadUrl: string | null;
  }> = [];

  for (const folder of topLevel || []) {
    if (!folder.name) continue;
    const userId = folder.name;

    const { data: files, error: filesError } = await supabaseAdmin.storage.from(BUCKET).list(userId);
    if (filesError) {
      console.error(`admin-list-attachments: listing folder ${userId} failed:`, filesError);
      continue;
    }

    for (const file of files || []) {
      if (!file.id) continue; // skip nested "folders", attachments are never nested further

      const path = `${userId}/${file.name}`;
      const { data: signed } = await supabaseAdmin.storage.from(BUCKET).createSignedUrl(path, SIGNED_URL_EXPIRY_SECONDS);

      attachments.push({
        path,
        filename: displayFilename(file.name),
        uploaderId: userId,
        uploaderName: nameByUserId.get(userId) || userId,
        uploadedAt: file.created_at || null,
        sizeBytes: file.metadata?.size ?? null,
        downloadUrl: signed?.signedUrl || null
      });
    }
  }

  attachments.sort((a, b) => (b.uploadedAt || '').localeCompare(a.uploadedAt || ''));

  return jsonResponse({ attachments });
}

Deno.serve(handleRequest);
