import { ArrowRight, Clock } from "lucide-react";
import { Link } from "react-router-dom";
import { activeServices, categories, formatPrice, needsQuote } from "../../data/catalog";

/**
 * The ordering grid, and the dashboard's service navigation.
 *
 * .click shows one flat row of eight services. Nineteen in one grid is a
 * wall, so these are grouped by the three categories the catalogue already
 * defines -- the same three the public /services page filters by, so a
 * client who browsed before signing up recognises the shape.
 *
 * Each card opens a scoping form, not a checkout. Nothing here can be
 * bought on the spot: .biz agrees the work first, which is why a
 * "from" price says so on the card rather than being presented as the price.
 */
export function ServicesSection() {
  return (
    <section id="services" className="py-8 sm:py-10">
      <div className="mb-5">
        <h2 className="font-display text-xl font-semibold text-fg sm:text-2xl">Start something</h2>
        <p className="mt-1 text-sm text-fg-muted">
          Pick a service and tell us about it. We come back with scope and a price before anything
          is charged.
        </p>
      </div>

      <div className="flex flex-col gap-8">
        {categories.map((category) => {
          const services = activeServices.filter((service) => service.category === category.id);
          return (
            <div key={category.id}>
              <div className="mb-3 flex items-center gap-2">
                <category.icon className="h-4 w-4 shrink-0 text-orange-400" strokeWidth={2.25} />
                <h3 className="font-display text-base font-semibold text-fg">{category.label}</h3>
                <span className="text-xs text-fg-faint">{services.length}</span>
              </div>

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {services.map((service) => (
                  <Link
                    key={service.id}
                    to={`/dashboard/request/${service.id}`}
                    className="group flex flex-col gap-3 rounded-2xl border border-border bg-surface p-4 transition-all duration-200 hover:-translate-y-0.5 hover:border-orange-400/40 hover:bg-surface-2"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-orange-400/10 transition-colors duration-200 group-hover:bg-orange-400/20">
                        <service.icon className="h-5 w-5 text-orange-400" strokeWidth={2.25} />
                      </span>
                      <span className="font-display text-sm font-semibold whitespace-nowrap text-orange-400">
                        {formatPrice(service)}
                      </span>
                    </div>

                    <div className="min-w-0">
                      <p className="font-display text-base font-semibold text-fg">{service.name}</p>
                      <p className="mt-1 text-xs leading-relaxed text-fg-muted">{service.summary}</p>
                    </div>

                    <div className="mt-auto flex items-center justify-between gap-2 pt-1">
                      <span className="flex items-center gap-1 text-[11px] font-medium text-fg-faint">
                        <Clock className="h-3 w-3" /> {service.deliveryEstimate}
                      </span>
                      <span className="flex items-center gap-1 text-xs font-semibold text-fg-muted transition-colors group-hover:text-orange-400">
                        {needsQuote(service) ? "Get a quote" : "Start"}
                        <ArrowRight className="h-3 w-3 transition-transform group-hover:translate-x-0.5" />
                      </span>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
