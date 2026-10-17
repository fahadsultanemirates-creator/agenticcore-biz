import { Check, Copy, Gift } from "lucide-react";
import { useEffect, useState, type FormEvent } from "react";
import { DashboardNav } from "../components/dashboard/DashboardNav";
import { DashboardShell } from "../components/dashboard/DashboardShell";
import { useAuth } from "../context/AuthContext";
import { SUPPORT_EMAIL } from "../data/contact";
import { useProfile } from "../lib/dashboardData";
import { BUSINESS_POOL_THRESHOLD, businessPoolRemaining, money } from "../lib/payment";
import { supabase } from "../lib/supabase";

/**
 * Name, business name, spend, status, referral link, sign out.
 *
 * Only two columns are writable from here. protect_profile_fields
 * freezes total_spend, points_balance, is_business_pool, referral_code,
 * referred_by and is_admin against the anon and authenticated roles, so
 * sending any of them would be silently ignored rather than applied --
 * which is worse than not sending them, because the form would look like
 * it had saved.
 *
 * The referral card shows the link and the points balance and makes no
 * claim about what a point is worth or what a referral earns. .agency
 * publishes a three-level 20/10/5 schedule and a "1 Point = $1" rate;
 * .biz publishes neither, anywhere. The plumbing exists -- signup reads
 * ?ref and handle_new_user resolves it -- so the link is real and worth
 * giving out, but inventing the rate to fill the space would be making
 * up a policy. See the PR for the question.
 */
export function Account() {
  const { user, logout } = useAuth();
  const { profile, loading } = useProfile();

  const [name, setName] = useState("");
  const [company, setCompany] = useState("");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");
  const [copied, setCopied] = useState(false);

  // Seeded from the profile once it arrives, not on every render: doing
  // the latter would fight the client for the caret while they type.
  useEffect(() => {
    if (!profile) return;
    setName(profile.full_name ?? "");
    setCompany(profile.company_name ?? "");
  }, [profile]);

  const save = async (event: FormEvent) => {
    event.preventDefault();
    if (!user) return;
    setSaving(true);
    setError("");
    const { error: saveError } = await supabase
      .from("profiles")
      .update({ full_name: name.trim() || null, company_name: company.trim() || null })
      .eq("id", user.id);
    setSaving(false);
    if (saveError) {
      console.error("Saving profile failed:", saveError.message);
      setError("We couldn't save that just now. Please try again.");
      return;
    }
    setSaved(true);
    window.setTimeout(() => setSaved(false), 2000);
  };

  const referralLink = profile ? `https://agenticcore.biz/signup?ref=${profile.referral_code}` : "";

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(referralLink);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1600);
    } catch {
      // Some in-app browsers refuse the clipboard. The link is selectable.
    }
  };

  const spend = Number(profile?.total_spend ?? 0);
  const inPool = profile?.is_business_pool ?? false;

  return (
    <DashboardShell title="Account Settings">
      <DashboardNav />
      <section className="py-8">
        <h1 className="font-display text-2xl font-semibold text-fg sm:text-3xl">
          Account Settings
        </h1>

        <div className="mt-6 grid max-w-3xl gap-5">
          <form onSubmit={save} className="rounded-2xl border border-border bg-surface p-5">
            <h2 className="font-display text-base font-semibold text-fg">Your details</h2>

            <div className="mt-4 flex flex-col gap-4">
              <label className="flex flex-col gap-1.5">
                <span className="text-xs font-semibold tracking-wide text-fg-muted uppercase">
                  Name
                </span>
                <input
                  value={name}
                  onChange={(event) => setName(event.target.value)}
                  autoComplete="name"
                  className="rounded-xl border-2 border-border bg-void px-3.5 py-2.5 text-fg placeholder:text-fg-faint focus:border-orange-400 focus:outline-none"
                />
              </label>

              <label className="flex flex-col gap-1.5">
                <span className="text-xs font-semibold tracking-wide text-fg-muted uppercase">
                  Business name
                </span>
                <input
                  value={company}
                  onChange={(event) => setCompany(event.target.value)}
                  autoComplete="organization"
                  placeholder="Optional"
                  className="rounded-xl border-2 border-border bg-void px-3.5 py-2.5 text-fg placeholder:text-fg-faint focus:border-orange-400 focus:outline-none"
                />
              </label>

              <div className="flex flex-col gap-1.5">
                <span className="text-xs font-semibold tracking-wide text-fg-muted uppercase">
                  Email
                </span>
                <p className="rounded-xl border-2 border-border bg-void px-3.5 py-2.5 text-fg-muted">
                  {user?.email}
                </p>
                <p className="text-xs text-fg-faint">
                  Changing the address on an account needs a confirmation step we have not built —{" "}
                  <a
                    href={`mailto:${SUPPORT_EMAIL}`}
                    className="font-semibold text-orange-400 hover:underline"
                  >
                    email us
                  </a>{" "}
                  and we will move it.
                </p>
              </div>
            </div>

            {error ? <p className="mt-3 text-sm text-orange-300">{error}</p> : null}

            <button
              type="submit"
              disabled={saving || loading}
              className="mt-5 inline-flex items-center gap-2 rounded-full bg-orange-400 px-5 py-2.5 text-sm font-semibold text-void transition-transform hover:-translate-y-0.5 disabled:opacity-60"
            >
              {saved ? <Check className="h-4 w-4" /> : null}
              {saving ? "Saving…" : saved ? "Saved" : "Save changes"}
            </button>
          </form>

          <div className="rounded-2xl border border-border bg-surface p-5">
            <h2 className="font-display text-base font-semibold text-fg">Spend &amp; status</h2>
            <dl className="mt-4 grid gap-4 sm:grid-cols-3">
              <div>
                <dt className="text-xs font-semibold tracking-wide text-fg-faint uppercase">
                  Lifetime spend
                </dt>
                <dd className="mt-1 font-display text-xl font-semibold text-fg">{money(spend)}</dd>
              </div>
              <div>
                <dt className="text-xs font-semibold tracking-wide text-fg-faint uppercase">
                  AgenticCore Points
                </dt>
                <dd className="mt-1 font-display text-xl font-semibold text-fg">
                  {Number(profile?.points_balance ?? 0)}
                </dd>
              </div>
              <div>
                <dt className="text-xs font-semibold tracking-wide text-fg-faint uppercase">
                  Business Pool
                </dt>
                <dd className="mt-1 font-display text-xl font-semibold text-fg">
                  {inPool ? "Member" : "Not yet"}
                </dd>
              </div>
            </dl>
            {inPool ? (
              <p className="mt-4 text-xs text-fg-faint">
                Business Pool member — 20% off every service, a dedicated manager and faster
                delivery.
              </p>
            ) : spend > 0 ? (
              <p className="mt-4 text-xs text-fg-faint">
                {money(businessPoolRemaining(spend))} more in lifetime spend unlocks a dedicated
                manager, 20% off and faster delivery.
              </p>
            ) : (
              <p className="mt-4 text-xs text-fg-faint">
                Business Pool starts at {money(BUSINESS_POOL_THRESHOLD)} of lifetime spend: a
                dedicated manager, 20% off every service and faster delivery.
              </p>
            )}
          </div>

          <div className="rounded-2xl border border-border bg-surface p-5">
            <h2 className="flex items-center gap-2 font-display text-base font-semibold text-fg">
              <Gift className="h-4 w-4 text-orange-400" /> Refer someone
            </h2>
            <p className="mt-1.5 text-sm text-fg-muted">
              Anyone who signs up through your link is recorded as your referral.
            </p>
            {profile ? (
              <div className="mt-4 flex items-center gap-2">
                <code className="min-w-0 flex-1 truncate rounded-lg bg-void px-3 py-2 font-mono text-xs text-fg sm:text-sm">
                  {referralLink}
                </code>
                <button
                  type="button"
                  onClick={() => void copy()}
                  aria-label="Copy referral link"
                  className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border-2 border-border text-fg-muted transition-colors hover:border-orange-400/50 hover:text-fg"
                >
                  {copied ? (
                    <Check className="h-4 w-4 text-orange-400" />
                  ) : (
                    <Copy className="h-4 w-4" />
                  )}
                </button>
              </div>
            ) : null}
          </div>

          <div className="rounded-2xl border border-border bg-surface p-5">
            <h2 className="font-display text-base font-semibold text-fg">Session</h2>
            <button
              type="button"
              onClick={() => void logout()}
              className="mt-3 rounded-full border-2 border-border px-5 py-2.5 text-sm font-semibold text-fg-muted transition-colors hover:border-orange-400/50 hover:text-fg"
            >
              Sign out
            </button>
          </div>
        </div>
      </section>
    </DashboardShell>
  );
}
