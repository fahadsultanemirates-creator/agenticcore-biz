import { createClient } from "@supabase/supabase-js";

/**
 * The browser's Supabase client.
 *
 * Two deliberate choices here, both of which cost somebody a day on one of
 * the sister sites.
 *
 * THE KEY FORMAT. This is the legacy JWT-format anon key, not the newer
 * sb_publishable_ one that public/supabase-client.js uses. On .click,
 * Edge Function invocation failed silently with the publishable key --
 * no client error, and zero server-side logs, meaning the request never
 * left the browser. Auth itself works with either, but forge-chat and
 * anything else server-side does not, and a key that works for nine
 * things out of ten is worse than one that fails loudly.
 *
 * Neither key is a secret. Both carry the `anon` role; what a visitor can
 * actually read or write is decided by row-level security on the tables and
 * by each Edge Function's own auth check. public/supabase-client.js has
 * shipped its key in plain sight to every visitor since the site launched.
 *
 * THE FALLBACK. The values come from Vite env vars when they are set, and
 * from the literals otherwise. A missing Netlify variable would otherwise
 * build cleanly and ship `undefined` as the URL, which fails at runtime as
 * a blank page on every signed-in route -- the worst possible place to find
 * out. Since these values are public anyway, the literal costs nothing and
 * removes a deploy-time foot-gun.
 *
 * The session is stored under a key derived from the project ref, so the
 * React pages and the remaining legacy pages share one login even though
 * they build their clients separately.
 */
/**
 * Did this page load from a password-recovery link?
 *
 * Captured HERE, above createClient, and that placement is the whole point.
 * supabase-js reads the recovery token out of the URL fragment and then
 * clears it, so anything that asks later may find an empty hash and
 * conclude this was an ordinary visit.
 *
 * Why it is needed at all: resetPasswordForEmail asks Supabase to send the
 * client back to /reset, but Supabase only honours a redirect it has been
 * configured to allow. If /reset is not on the project's Redirect URLs
 * list, it silently substitutes the Site URL -- so the client lands on the
 * homepage holding a valid recovery session, sees a marketing page, and has
 * no way to set a password. Nothing errors. They are simply locked out.
 *
 * App.tsx uses this to send them to /reset wherever they land, which makes
 * the flow work whether or not that setting is right.
 */
export const ARRIVED_FOR_RECOVERY =
  typeof window !== "undefined" && /(?:^|[#&?])type=recovery(?:[&=]|$)/.test(window.location.hash);

const SUPABASE_URL =
  (import.meta.env.VITE_SUPABASE_URL as string | undefined) ?? "https://bvpdvtsshivkzhcmszkd.supabase.co";

const SUPABASE_ANON_KEY =
  (import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined) ??
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJ2cGR2dHNzaGl2a3poY21zemtkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODg2MDg2MzcsImV4cCI6MjEwNDE4NDYzN30.jhAWBfDL_2IfWQFvjbJJP02zETb85ybtMA-J25cVmBQ";

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
