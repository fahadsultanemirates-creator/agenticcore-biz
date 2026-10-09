import { ArrowRight, FolderKanban, Sparkles } from "lucide-react";
import { Link } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { businessPoolProgress, businessPoolRemaining, money } from "../../lib/payment";
import type { ProfileRow } from "../../lib/dashboardData";

/**
 * Top of the dashboard: who you are, where your work is, and -- if it is
 * actually close -- how far off Business Pool is.
 *
 * The progress bar renders only once a client has spent something. Showing
 * "$5,000 more unlocks Business Pool" to somebody on day one is not a
 * progress bar, it is a price tag with a loading animation.
 */
export function WelcomeSection({
  profile,
  outstanding,
}: {
  profile: ProfileRow | null;
  outstanding: number;
}) {
  const { user } = useAuth();
  const firstName = user?.name?.trim()?.split(" ")[0] ?? "there";
  const spend = Number(profile?.total_spend ?? 0);
  const inPool = profile?.is_business_pool ?? false;

  return (
    <section className="pt-8 sm:pt-10">
      <div className="relative overflow-hidden rounded-2xl border border-border bg-surface p-5 sm:p-7">
        <div
          aria-hidden
          className="pointer-events-none absolute -top-20 -right-16 h-56 w-56 rounded-full bg-orange-400/10 blur-3xl"
        />
        <div className="relative">
          <p className="text-xs font-semibold tracking-wide text-fg-faint uppercase">
            {profile?.company_name || "Your workspace"}
          </p>
          <h1 className="mt-1.5 font-display text-2xl font-semibold text-fg sm:text-3xl">
            Welcome back, {firstName}.
          </h1>
          <p className="mt-2 max-w-md text-sm text-fg-muted sm:text-base">
            Pick a service below and we'll scope it with you. Everything we're running for you
            lives in your projects.
          </p>

          {outstanding > 0 ? (
            <a
              href="#billing"
              className="mt-4 inline-flex items-center gap-2 rounded-full border border-orange-400/40 bg-orange-400/10 px-4 py-2 text-sm font-semibold text-orange-400 transition-colors hover:bg-orange-400/20"
            >
              {money(outstanding)} due
              <ArrowRight className="h-4 w-4" />
            </a>
          ) : null}

          <div className="mt-5 flex flex-wrap gap-3">
            <Link
              to="/projects"
              className="inline-flex items-center justify-center gap-2 rounded-full bg-orange-400 px-5 py-3 text-sm font-semibold text-void shadow-glow-orange transition-transform hover:-translate-y-0.5 active:translate-y-0"
            >
              <FolderKanban className="h-4 w-4" /> Your projects
              <ArrowRight className="h-4 w-4" />
            </Link>
            <Link
              to="/create-project"
              className="inline-flex items-center justify-center gap-2 rounded-full border-2 border-border px-5 py-3 text-sm font-semibold text-fg-muted transition-colors hover:border-orange-400/50 hover:text-fg"
            >
              <Sparkles className="h-4 w-4" /> Not sure? Ask Forge
            </Link>
          </div>

          {inPool ? (
            <p className="mt-5 inline-flex items-center gap-2 rounded-full border border-orange-400/40 bg-orange-400/10 px-3 py-1.5 text-xs font-semibold text-orange-400">
              Business Pool member — 20% off every service
            </p>
          ) : spend > 0 ? (
            <div className="mt-6 max-w-sm">
              <div className="flex items-baseline justify-between gap-3 text-xs">
                <span className="font-semibold tracking-wide text-fg-faint uppercase">
                  Business Pool
                </span>
                <span className="text-fg-muted">
                  {money(spend)} of {money(5000)}
                </span>
              </div>
              <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-void">
                <div
                  className="h-full rounded-full bg-orange-400"
                  style={{ width: `${businessPoolProgress(spend)}%` }}
                />
              </div>
              <p className="mt-2 text-xs text-fg-faint">
                ${businessPoolRemaining(spend).toLocaleString("en-US")} more in lifetime spend
                unlocks a dedicated manager, 20% off and faster delivery.
              </p>
            </div>
          ) : null}
        </div>
      </div>
    </section>
  );
}
