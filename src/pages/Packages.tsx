import { ArrowRight, Check, X } from "lucide-react";
import { Link } from "react-router-dom";
import { PublicShell } from "../components/PublicShell";
import { formatPrice, packages, serviceById } from "../data/catalog";

export function Packages() {
  return (
    <PublicShell title="Business Packages">
      <section className="py-10 sm:py-14">
        <h1 className="font-display text-3xl font-semibold text-fg sm:text-4xl">
          Business packages
        </h1>
        <p className="mt-3 max-w-2xl text-fg-muted">
          Three bundles for the common cases. Everything in them is also available individually —
          a package is a convenience, not a requirement.
        </p>

        <div className="mt-10 flex flex-col gap-4">
          {packages.map((pkg) => (
            <div
              key={pkg.id}
              id={pkg.id}
              className="scroll-mt-24 rounded-2xl border border-border bg-surface p-6 sm:p-8"
            >
              <div className="flex flex-wrap items-baseline justify-between gap-3">
                <div>
                  <h2 className="font-display text-2xl font-semibold text-fg">{pkg.name}</h2>
                  <p className="mt-1 text-sm text-fg-muted">{pkg.audience}</p>
                </div>
                <p className="font-display text-3xl font-semibold text-orange-400">
                  {formatPrice(pkg)}
                </p>
              </div>

              <div className="mt-6 grid gap-6 lg:grid-cols-2">
                <div>
                  <h3 className="text-xs font-semibold tracking-wide text-fg-muted uppercase">
                    Included
                  </h3>
                  <ul className="mt-3 flex flex-col gap-2">
                    {pkg.included.map((line) => (
                      <li key={line} className="flex items-start gap-2.5 text-sm text-fg-muted">
                        <Check className="mt-0.5 h-4 w-4 shrink-0 text-orange-400" />
                        {line}
                      </li>
                    ))}
                  </ul>
                </div>
                <div>
                  <h3 className="text-xs font-semibold tracking-wide text-fg-muted uppercase">
                    Not included
                  </h3>
                  <ul className="mt-3 flex flex-col gap-2">
                    {pkg.excluded.map((line) => (
                      <li key={line} className="flex items-start gap-2.5 text-sm text-fg-faint">
                        <X className="mt-0.5 h-4 w-4 shrink-0" />
                        {line}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              {/* Which catalog services the package draws on, so the
                  bundle price can be checked against the parts. */}
              <div className="mt-6 border-t border-border pt-4">
                <h3 className="text-xs font-semibold tracking-wide text-fg-muted uppercase">
                  Built from
                </h3>
                <div className="mt-2 flex flex-wrap gap-2">
                  {pkg.serviceIds.map((id) => {
                    const s = serviceById(id);
                    if (!s) return null;
                    return (
                      <Link
                        key={id}
                        to={`/services/${id}`}
                        className="rounded-full border border-border px-3 py-1.5 text-xs text-fg-muted transition-colors hover:border-orange-400/50 hover:text-fg"
                      >
                        {s.name}
                      </Link>
                    );
                  })}
                </div>
              </div>

              {pkg.terms && (
                <p className="mt-4 rounded-xl border border-orange-400/30 bg-orange-400/5 p-4 text-sm text-fg-muted">
                  <span className="font-semibold text-fg">Service period. </span>
                  {pkg.terms}
                </p>
              )}

              <Link
                to={`/create-project?q=${encodeURIComponent(`I would like the ${pkg.name} package (${formatPrice(pkg)}).`)}`}
                className="group mt-6 inline-flex items-center gap-2 rounded-full bg-orange-400 px-6 py-3 text-sm font-semibold text-void transition-transform hover:-translate-y-0.5"
              >
                Start with {pkg.name}
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
              </Link>
            </div>
          ))}
        </div>

        {/* The brief is explicit: do not switch on recurring billing
            without a working mechanism and clear consent. */}
        <p className="mx-auto mt-10 max-w-2xl text-center text-sm text-fg-muted">
          Monthly packages are billed per service month. Nothing renews automatically without your
          confirmation — we invoice each service month and you choose whether to continue.
        </p>
      </section>
    </PublicShell>
  );
}
