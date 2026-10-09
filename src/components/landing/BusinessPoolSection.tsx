import { ArrowRight, Gift, Users } from "lucide-react";
import { Reveal } from "../Reveal";
import { BUSINESS_POOL_THRESHOLD_USD } from "../../data/services";

/** The two loyalty programmes the legacy landing closed on. */
export function BusinessPoolSection() {
  return (
    <section className="border-t border-border py-20 md:py-28">
      <div className="mx-auto max-w-6xl px-6">
        <div className="grid gap-6 lg:grid-cols-2">
          <Reveal className="h-full">
            <div className="flex h-full flex-col gap-4 rounded-2xl border border-border bg-surface p-7">
              <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-orange-400/10">
                <Users className="h-5 w-5 text-orange-400" strokeWidth={2.25} />
              </span>
              <h2 className="font-display text-2xl font-semibold text-fg sm:text-3xl">
                Built for teams who work with us often
              </h2>
              <p className="text-fg-muted">
                Once your spend crosses ${BUSINESS_POOL_THRESHOLD_USD.toLocaleString()}, you're in the
                Business Pool — priority delivery on every request, a dedicated manager, and real
                savings.
              </p>
              <a
                href="/business-pool.html"
                className="mt-auto inline-flex w-fit items-center gap-2 rounded-full border-2 border-border px-5 py-2.5 text-sm font-semibold text-fg transition-colors hover:border-orange-400/60"
              >
                How the Business Pool works
                <ArrowRight className="h-4 w-4" />
              </a>
            </div>
          </Reveal>

          <Reveal delay={80} className="h-full">
            <div className="flex h-full flex-col gap-4 rounded-2xl border border-border bg-surface p-7">
              <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-orange-400/10">
                <Gift className="h-5 w-5 text-orange-400" strokeWidth={2.25} />
              </span>
              <h2 className="font-display text-2xl font-semibold text-fg sm:text-3xl">
                Bring in clients, earn AgenticCore Points
              </h2>
              <p className="text-fg-muted">
                Refer a business that signs up and you earn points against your own marketing — the
                more you bring in, the less yours costs.
              </p>
              <a
                href="/referral.html"
                className="mt-auto inline-flex w-fit items-center gap-2 rounded-full border-2 border-border px-5 py-2.5 text-sm font-semibold text-fg transition-colors hover:border-orange-400/60"
              >
                How referrals work
                <ArrowRight className="h-4 w-4" />
              </a>
            </div>
          </Reveal>
        </div>
      </div>
    </section>
  );
}
