import { ArrowRight, Sparkles } from "lucide-react";
import { Link } from "react-router-dom";

export function FinalCta() {
  return (
    <section className="border-t border-border py-20 md:py-28">
      <div className="mx-auto max-w-3xl px-6 text-center">
        <h2 className="font-display text-3xl font-semibold text-fg sm:text-4xl">
          Your business has enough to manage. Let us handle the back-office work.
        </h2>
        <p className="mt-4 text-fg-muted">
          Choose a service, get a clear scope and price, and manage your work through one convenient
          dashboard.
        </p>
        <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
          <a
            href="/signup.html"
            className="group inline-flex items-center gap-2 rounded-full bg-orange-400 px-7 py-3.5 text-base font-semibold text-void shadow-glow-orange transition-transform hover:-translate-y-0.5"
          >
            Get Started Free
            <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
          </a>
          <Link
            to="/create-project"
            className="inline-flex items-center gap-2 rounded-full border-2 border-border px-7 py-3.5 text-base font-semibold text-fg transition-colors hover:border-orange-400/60"
          >
            <Sparkles className="h-4 w-4 text-orange-400" />
            Create a Project with Forge
          </Link>
        </div>
        <p className="mt-4 text-xs text-fg-faint">
          “Get Started Free” creates your account. Services are paid individually or monthly.
        </p>
      </div>
    </section>
  );
}
