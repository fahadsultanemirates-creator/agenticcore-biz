import { ArrowRight, Building2, Check } from "lucide-react";
import { Reveal } from "../Reveal";

// The specialty, and the reason .biz exists as its own site rather than a
// page on .agency. Kept near the top of the page for the same reason it
// was on the legacy landing: it is what the business is known for.
const REAL_ESTATE = [
  "Full campaign design, start to finish",
  "All creative and design work",
  "Automated social posting",
  "Full project marketing management",
];

const ANY_BUSINESS = [
  "Full-service marketing management, not just a single task",
  "Planning, content, posting and monitoring, end to end",
  "The same approach as the real estate work, matched to your business",
];

export function RealEstateSection() {
  return (
    <section className="border-t border-border py-20 md:py-28">
      <div className="mx-auto max-w-6xl px-6">
        <div className="grid gap-6 lg:grid-cols-2">
          <Reveal className="h-full">
            <div className="flex h-full flex-col gap-4 rounded-2xl border border-orange-400/30 bg-orange-400/5 p-7">
              <span className="inline-flex w-fit items-center gap-2 rounded-full border border-orange-400/40 bg-void/40 px-3 py-1 text-xs font-semibold text-orange-400">
                Our specialty
              </span>
              <h2 className="font-display text-2xl font-semibold text-fg sm:text-3xl">
                Marketing built for real estate developers
              </h2>
              <p className="text-fg-muted">
                We design and run complete marketing campaigns specifically for real estate
                developers, using the latest AI tools to reach real, qualified buyers.
              </p>
              <ul className="mt-1 flex flex-col gap-2">
                {REAL_ESTATE.map((line) => (
                  <li key={line} className="flex items-start gap-2.5 text-sm text-fg-muted">
                    <Check className="mt-0.5 h-4 w-4 shrink-0 text-orange-400" />
                    {line}
                  </li>
                ))}
              </ul>
              <a
                href="/real-estate.html"
                className="group mt-auto inline-flex w-fit items-center gap-2 rounded-full bg-orange-400 px-5 py-2.5 text-sm font-semibold text-void transition-transform hover:-translate-y-0.5"
              >
                See the real estate work
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
              </a>
            </div>
          </Reveal>

          <Reveal delay={80} className="h-full">
            <div className="flex h-full flex-col gap-4 rounded-2xl border border-border bg-surface p-7">
              <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-orange-400/10">
                <Building2 className="h-5 w-5 text-orange-400" strokeWidth={2.25} />
              </span>
              <h2 className="font-display text-2xl font-semibold text-fg sm:text-3xl">
                The same full-service marketing, for any business
              </h2>
              <p className="text-fg-muted">
                Whatever you run, we handle your entire marketing — planning, content, posting and
                monitoring, end to end.
              </p>
              <ul className="mt-1 flex flex-col gap-2">
                {ANY_BUSINESS.map((line) => (
                  <li key={line} className="flex items-start gap-2.5 text-sm text-fg-muted">
                    <Check className="mt-0.5 h-4 w-4 shrink-0 text-orange-400" />
                    {line}
                  </li>
                ))}
              </ul>
              <a
                href="#services"
                className="mt-auto inline-flex w-fit items-center gap-2 rounded-full border-2 border-border px-5 py-2.5 text-sm font-semibold text-fg transition-colors hover:border-orange-400/60"
              >
                Browse the services
              </a>
            </div>
          </Reveal>
        </div>
      </div>
    </section>
  );
}
