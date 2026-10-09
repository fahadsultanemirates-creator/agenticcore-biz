import { ArrowRight, Sparkles } from "lucide-react";
import { Link } from "react-router-dom";
import { DashboardPreview } from "./DashboardPreview";

export function Hero() {
  return (
    <section className="relative overflow-hidden">
      <div
        aria-hidden
        className="animate-blob pointer-events-none absolute -top-40 left-1/2 h-[32rem] w-[32rem] -translate-x-1/2 rounded-full bg-orange-400/10 blur-3xl"
      />
      <div className="relative mx-auto max-w-5xl px-6 pt-16 pb-20 text-center md:pt-24 md:pb-28">
        <span className="animate-fade-up inline-flex items-center gap-2 rounded-full border border-border bg-surface px-4 py-2 text-xs font-semibold tracking-wide text-fg-muted uppercase">
          Your AI-powered business operations partner
        </span>

        <h1 className="animate-fade-up mt-8 font-display text-5xl leading-[1.05] font-semibold tracking-tight text-fg sm:text-6xl md:text-7xl">
          Start your business.
          <br />
          <span className="text-orange-400">Organize it.</span>
          <br />
          Keep it running.
        </h1>

        <p className="animate-fade-up mx-auto mt-6 max-w-2xl text-lg text-fg-muted sm:text-xl">
          From startup planning and invoicing to bookkeeping assistance, customer management and
          ongoing business support — AgenticCore.biz helps you handle the work behind your business
          without building a large team.
        </p>

        <div className="animate-fade-up mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
          <a
            href="#services"
            className="group inline-flex items-center gap-2 rounded-full bg-orange-400 px-7 py-3.5 text-base font-semibold text-void shadow-glow-orange transition-transform hover:-translate-y-0.5 active:translate-y-0"
          >
            Explore Business Services
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

        <p className="animate-fade-up mt-5 text-sm text-fg-faint">
          Already have an account?{" "}
          <a href="/dashboard.html" className="font-semibold text-orange-400 hover:underline">
            Open Dashboard
          </a>
        </p>

        <DashboardPreview />
      </div>
    </section>
  );
}
