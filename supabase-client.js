// AgenticCore Biz — Supabase client configuration
// This uses the publishable key (Supabase's current name for what was
// previously called the "anon key") -- safe for browser use. Security is
// enforced by Row Level Security policies on the database, not by keeping
// this key secret.

const SUPABASE_URL = 'https://bvpdvtsshivkzhcmszkd.supabase.co';
const SUPABASE_PUBLISHABLE_KEY = 'sb_publishable_wqO09sQ75cF_gsjjDvU5Ng_O2Mypo-h';

const supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY);
