import { ArrowRight, ClipboardCheck, MessageSquare } from "lucide-react";
import dashboardPreview from "../../assets/dashboard-preview.webp";
import { CHEAPEST_USD, SERVICE_COUNT } from "../../data/services";

export function Hero() {
  return (
    <section className="relative overflow-hidden">
      <div
        aria-hidden
        className="animate-blob pointer-events-none absolute -top-40 left-1/2 h-[32rem] w-[32rem] -translate-x-1/2 rounded-full bg-orange-400/10 blur-3xl"
      />
      <div className="relative mx-auto max-w-5xl px-6 pt-16 pb-20 text-center md:pt-24 md:pb-28">
        <span className="animate-fade-up inline-flex items-center gap-2 rounded-full border border-border bg-surface px-4 py-2 text-sm text-fg-muted">
          <ClipboardCheck className="h-4 w-4 text-orange-400" />
          Planned before it's posted
        </span>

        <h1 className="animate-fade-up mt-8 font-display text-5xl leading-[1.05] font-semibold tracking-tight text-fg sm:text-6xl md:text-7xl">
          Marketing that starts with a <span className="text-orange-400">plan</span>, not a posting
          schedule.
        </h1>

        <p className="animate-fade-up mx-auto mt-6 max-w-2xl text-lg text-fg-muted sm:text-xl">
          Before a single post goes out, we assess your product, your website and your competition.
          Then social, AI agents and auto-posting go to work — matched to what will actually move your
          business.
        </p>

        <p className="animate-fade-up mx-auto mt-4 max-w-2xl text-base text-fg-muted">
          {SERVICE_COUNT} AI marketing services, à la carte, with real published prices — from $
          {CHEAPEST_USD} a video to full marketing management. No bundles, no credits.
        </p>

        <div className="animate-fade-up mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
          <a
            href="/signup.html"
            className="group inline-flex items-center gap-2 rounded-full bg-orange-400 px-7 py-3.5 text-base font-semibold text-void shadow-glow-orange transition-transform hover:-translate-y-0.5 active:translate-y-0"
          >
            Start your project
            <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
          </a>
          <a
            href="#services"
            className="inline-flex items-center gap-2 rounded-full border-2 border-border px-7 py-3.5 text-base font-semibold text-fg transition-colors hover:border-orange-400/60"
          >
            See all {SERVICE_COUNT} services
          </a>
          <a
            href="/how-it-works.html#discovery"
            className="inline-flex items-center gap-2 rounded-full border-2 border-border px-7 py-3.5 text-base font-semibold text-fg transition-colors hover:border-orange-400/60"
          >
            <MessageSquare className="h-4 w-4 text-orange-400" />
            Talk it through first
          </a>
        </div>

        {/* No "paid in USDT" line here, unlike the other two sites. Nothing
            on .biz has a single number to pay up front -- every price is a
            range until discovery settles it -- so promising a checkout
            would be the page contradicting the pitch two paragraphs up. */}
        <p className="animate-fade-up mt-4 text-xs text-fg-faint">
          Every engagement starts with a discovery call. You see the plan and the real number before
          you pay anything.
        </p>

        <div className="animate-fade-up mx-auto mt-16 max-w-3xl md:mt-20" style={{ animationDelay: "150ms" }}>
          <img src={dashboardPreview} alt="" aria-hidden width={1100} height={619} className="h-auto w-full rounded-2xl border border-border" />
        </div>
      </div>
    </section>
  );
}
