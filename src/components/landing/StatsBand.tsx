import { BUSINESS_POOL_THRESHOLD_USD, SERVICE_COUNT, serviceCategories } from "../../data/services";

const STATS = [
  { value: String(SERVICE_COUNT), label: "AI marketing services" },
  { value: String(serviceCategories.length), label: "disciplines covered" },
  { value: "0", label: "credit packs sold" },
  { value: `$${(BUSINESS_POOL_THRESHOLD_USD / 1000).toFixed(0)}k`, label: "unlocks the Business Pool" },
];

export function StatsBand() {
  return (
    <section className="border-t border-border py-14">
      <div className="mx-auto max-w-6xl px-6">
        <dl className="grid grid-cols-2 gap-6 text-center lg:grid-cols-4">
          {STATS.map((stat) => (
            <div key={stat.label}>
              <dt className="sr-only">{stat.label}</dt>
              <dd>
                <span className="block font-display text-4xl font-semibold text-orange-400">
                  {stat.value}
                </span>
                <span className="mt-1 block text-sm text-fg-muted">{stat.label}</span>
              </dd>
            </div>
          ))}
        </dl>
      </div>
    </section>
  );
}
