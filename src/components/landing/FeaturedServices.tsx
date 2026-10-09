import { ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";
import { Reveal } from "../Reveal";
import { SERVICE_COUNT, featuredServices, formatPrice } from "../../data/catalog";

/**
 * Six, not nineteen. The homepage is not the catalog -- the full list
 * lives at /services, and burying six good entry points in a wall of
 * nineteen is how a visitor leaves without picking anything.
 *
 * Every figure comes from the catalog, so a price can never be changed
 * here and forgotten at the checkout.
 */
export function FeaturedServices() {
  return (
    <section id="services" className="border-t border-border py-20 md:py-28">
      <div className="mx-auto max-w-6xl px-6">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="font-display text-3xl font-semibold text-fg sm:text-4xl">
            Where most businesses start
          </h2>
          <p className="mt-4 text-fg-muted">
            Six of the most-ordered services. Every price is published, every scope is written down.
          </p>
        </div>

        <div className="mt-14 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {featuredServices.map((service, i) => (
            <Reveal key={service.id} delay={(i % 3) * 80} className="h-full">
              <Link
                to={`/services/${service.id}`}
                className="group flex h-full flex-col gap-3 rounded-2xl border border-border bg-surface p-5 transition-all duration-200 hover:-translate-y-1 hover:border-orange-400/40"
              >
                <div className="flex items-start justify-between gap-3">
                  <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-orange-400/10 transition-colors group-hover:bg-orange-400/20">
                    <service.icon className="h-5 w-5 text-orange-400" strokeWidth={2.25} />
                  </span>
                  <span className="rounded-full border border-border px-2.5 py-1 text-xs font-medium text-fg-faint">
                    {service.billing === "monthly" ? "Monthly" : "One-time"}
                  </span>
                </div>

                <div>
                  <h3 className="font-display text-base font-semibold text-fg">{service.name}</h3>
                  <p className="mt-1 text-sm text-fg-muted">{service.summary}</p>
                </div>

                <p className="mt-auto pt-2 font-display text-lg font-semibold text-orange-400">
                  {formatPrice(service)}
                </p>
              </Link>
            </Reveal>
          ))}
        </div>

        <div className="mt-12 text-center">
          <Link
            to="/services"
            className="group inline-flex items-center gap-2 rounded-full bg-orange-400 px-6 py-3 text-sm font-semibold text-void transition-transform hover:-translate-y-0.5"
          >
            Browse All {SERVICE_COUNT} Services
            <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
          </Link>
        </div>
      </div>
    </section>
  );
}
