import { ArrowRight } from "lucide-react";
import { Reveal } from "../Reveal";
import { SERVICE_COUNT, formatPrice, serviceCategories } from "../../data/services";

export function ServicesGrid() {
  return (
    <section id="services" className="border-t border-border py-20 md:py-28">
      <div className="mx-auto max-w-6xl px-6">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="font-display text-3xl font-semibold text-fg sm:text-4xl">
            {SERVICE_COUNT} AI marketing services, real published prices
          </h2>
          <p className="mt-4 text-fg-muted">
            No bundles, no packages — pick what your business actually needs, at a price you can see
            up front. Ranges are honest: where a service costs more, it is because there is more of
            it, and discovery is what decides which end you are at.
          </p>
        </div>

        <div className="mt-14 flex flex-col gap-10">
          {serviceCategories.map((category, ci) => (
            <div key={category.id}>
              <div className="mb-4 flex items-center gap-3">
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-orange-400/10">
                  <category.icon className="h-4.5 w-4.5 text-orange-400" strokeWidth={2.25} />
                </span>
                <div className="min-w-0">
                  <h3 className="font-display text-xl font-semibold text-fg">{category.label}</h3>
                  <p className="text-sm text-fg-muted">{category.tagline}</p>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {category.services.map((service, i) => (
                  <Reveal key={service.name} delay={((ci + i) % 3) * 80} className="h-full">
                    <a
                      href="/signup.html"
                      className="group relative flex h-full flex-col gap-3 rounded-2xl border border-border bg-surface p-5 transition-all duration-200 hover:-translate-y-1 hover:border-orange-400/40"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-orange-400/10 transition-colors duration-200 group-hover:bg-orange-400/20">
                          <service.icon className="h-5 w-5 text-orange-400" strokeWidth={2.25} />
                        </span>
                      </div>

                      <div>
                        <h4 className="font-display text-base font-semibold text-fg">{service.name}</h4>
                        <p className="mt-1 text-sm text-fg-muted">{service.detail}</p>
                      </div>

                      <div className="mt-auto pt-2">
                        {/* The whole price, including the monthly half and
                            the alternative way to buy it. Showing only the
                            lower bound would read as the price and be
                            wrong for most of these. */}
                        <p className="font-display text-sm font-semibold text-orange-400">
                          {formatPrice(service.price)}
                        </p>
                        <p className="text-xs text-fg-faint">{service.price.unit}</p>
                      </div>
                    </a>
                  </Reveal>
                ))}
              </div>
            </div>
          ))}
        </div>

        <div className="mt-12 text-center">
          <a
            href="/services.html"
            className="inline-flex items-center gap-2 rounded-full border-2 border-border px-6 py-3 text-sm font-semibold text-fg transition-colors hover:border-orange-400/60"
          >
            See what's included in every service
            <ArrowRight className="h-4 w-4" />
          </a>
        </div>
      </div>
    </section>
  );
}
