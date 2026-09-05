// AgenticCore Biz — Supabase client configuration
//
// Not wired to a live project yet: the dashboard schema and auth flow are
// being proven out first on AgenticCore Agency. These are placeholder
// values so the login/signup pages render without crashing; swap in a real
// project URL and publishable key once the Biz dashboard is ready to go live.

const SUPABASE_URL = 'https://your-project.supabase.co';
const SUPABASE_PUBLISHABLE_KEY = 'sb_publishable_placeholder_not_wired';

const supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY);
