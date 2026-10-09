import { ArrowRight, Check, X } from "lucide-react";
import { Link } from "react-router-dom";
import { Reveal } from "../Reveal";
import { formatPrice, packages } from "../../data/catalog";

export function PackagesSection() {
  return (
    <section id="packages" className="border-t border-border py-20 md:py-28">
      <div className="mx-auto max-w-6xl px-6">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="font-display text-3xl font-semibold text-fg sm:text-4xl">
            Start with a service. Or get a complete business support package.
          </h2>
        </div>

        <div className="mt-14 grid gap-4 lg:grid-cols-3">
          {packages.map((pkg, i) => (
            <Reveal key={pkg.id} delay={i * 80} className="h-full">
              <div
                className={`flex h-full flex-col gap-4 rounded-2xl border p-7 ${
                  pkg.billing === "monthly" && pkg.priceUsd === 149
                    ? "border-orange-400/40 bg-orange-400/5"
                    : "border-border bg-surface"
                }`}
              >
                <div>
                  <h3 className="font-display text-xl font-semibold text-fg">{pkg.name}</h3>
                  <p className="mt-1 font-display text-3xl font-semibold text-orange-400">
                    {formatPrice(pkg)}
                  </p>
                  <p className="mt-1.5 text-sm text-fg-muted">{pkg.audience}</p>
                </div>

                <ul className="flex flex-col gap-2">
                  {pkg.included.map((line) => (
                    <li key={line} className="flex items-start gap-2.5 text-sm text-fg-muted">
                      <Check className="mt-0.5 h-4 w-4 shrink-0 text-orange-400" />
                      {line}
                    </li>
                  ))}
                </ul>

                {/* Exclusions on the card, not behind a link. What a
                    package does NOT cover is the thing that causes the
                    argument later. */}
                <ul className="flex flex-col gap-2 border-t border-border pt-4">
                  {pkg.excluded.map((line) => (
                    <li key={line} className="flex items-start gap-2.5 text-sm text-fg-faint">
                      <X className="mt-0.5 h-4 w-4 shrink-0" />
                      {line}
                    </li>
                  ))}
                </ul>

                {pkg.terms && (
                  <p className="rounded-xl border border-border bg-void p-3 text-xs text-fg-muted">
                    {pkg.terms}
                  </p>
                )}

                <Link
                  to={`/packages#${pkg.id}`}
                  className="mt-auto inline-flex w-fit items-center gap-2 rounded-full border-2 border-border px-5 py-2.5 text-sm font-semibold text-fg transition-colors hover:border-orange-400/60"
                >
                  See full details
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </div>
            </Reveal>
          ))}
        </div>

        <div className="mt-12 text-center">
          <Link
            to="/packages"
            className="inline-flex items-center gap-2 rounded-full border-2 border-border px-6 py-3 text-sm font-semibold text-fg transition-colors hover:border-orange-400/60"
          >
            Compare Packages
          </Link>
        </div>
      </div>
    </section>
  );
}
