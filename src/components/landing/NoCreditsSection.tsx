import { CircleSlash, Handshake } from "lucide-react";
import { Reveal } from "../Reveal";

/**
 * The two promises the legacy landing led with, and the reason this site
 * has no checkout: "we don't give blind promises" and "not another credit
 * system". Both say the same thing from different ends -- nothing starts
 * until somebody has looked at the business.
 */
export function NoCreditsSection() {
  return (
    <section className="border-t border-border py-20 md:py-28">
      <div className="mx-auto max-w-6xl px-6">
        <div className="grid gap-6 lg:grid-cols-2">
          <Reveal className="h-full">
            <div className="flex h-full flex-col gap-4 rounded-2xl border border-border bg-surface p-7">
              <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-orange-400/10">
                <Handshake className="h-5 w-5 text-orange-400" strokeWidth={2.25} />
              </span>
              <h2 className="font-display text-2xl font-semibold text-fg sm:text-3xl">
                We don't give blind promises
              </h2>
              <p className="text-fg-muted">
                We won't start marketing for any business without understanding its goals and
                requirements first — no exceptions, no matter which service. We're building
                long-term relationships through solid, well-planned strategy, not chasing quick
                transactional orders.
              </p>
            </div>
          </Reveal>

          <Reveal delay={80} className="h-full">
            <div className="flex h-full flex-col gap-4 rounded-2xl border border-border bg-surface p-7">
              <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-orange-400/10">
                <CircleSlash className="h-5 w-5 text-orange-400" strokeWidth={2.25} />
              </span>
              <h2 className="font-display text-2xl font-semibold text-fg sm:text-3xl">
                Not another credit system
              </h2>
              <p className="text-fg-muted">
                Most AI marketing tools sell credits — cheap, disposable, and built to run out before
                you see results. We plan first, then execute. We assess your product, website and
                competition before a single post goes out. Credits don't ask what you're actually
                selling.
              </p>
            </div>
          </Reveal>
        </div>
      </div>
    </section>
  );
}
