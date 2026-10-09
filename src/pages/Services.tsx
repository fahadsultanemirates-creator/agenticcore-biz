import { ArrowRight, Search } from "lucide-react";
import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { PublicShell } from "../components/PublicShell";
import {
  activeServices,
  categories,
  formatPrice,
  type ServiceCategoryId,
} from "../data/catalog";

/** The public directory. No login needed to see what things cost. */
export function Services() {
  const [query, setQuery] = useState("");
  const [cat, setCat] = useState<ServiceCategoryId | "all">("all");

  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    return activeServices.filter((s) => {
      if (cat !== "all" && s.category !== cat) return false;
      if (!q) return true;
      return (
        s.name.toLowerCase().includes(q) ||
        s.summary.toLowerCase().includes(q) ||
        s.id.toLowerCase().includes(q) ||
        s.deliverables.some((d) => d.toLowerCase().includes(q))
      );
    });
  }, [query, cat]);

  return (
    <PublicShell title="Our Services">
      <section className="py-10 sm:py-14">
        <h1 className="font-display text-3xl font-semibold text-fg sm:text-4xl">
          All {activeServices.length} services
        </h1>
        <p className="mt-3 max-w-2xl text-fg-muted">
          Every price published, every scope written down. Order individually, or combine them into
          a package.
        </p>

        <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center">
          <div className="relative flex-1">
            <Search className="pointer-events-none absolute top-1/2 left-3.5 h-4 w-4 -translate-y-1/2 text-fg-faint" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search services…"
              aria-label="Search services"
              className="w-full rounded-full border-2 border-border bg-surface py-2.5 pr-4 pl-10 text-sm text-fg placeholder:text-fg-faint focus:border-orange-400 focus:outline-none"
            />
          </div>
          <div className="flex flex-wrap gap-2">
            <FilterChip active={cat === "all"} onClick={() => setCat("all")}>
              All
            </FilterChip>
            {categories.map((c) => (
              <FilterChip key={c.id} active={cat === c.id} onClick={() => setCat(c.id)}>
                {c.label}
              </FilterChip>
            ))}
          </div>
        </div>

        {results.length === 0 ? (
          <p className="mt-12 rounded-2xl border border-border bg-surface px-5 py-10 text-center text-sm text-fg-muted">
            Nothing matches “{query}”. Try a different word, or{" "}
            <Link to="/create-project" className="font-semibold text-orange-400 hover:underline">
              describe what you need
            </Link>{" "}
            and we will work out which service fits.
          </p>
        ) : (
          <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {results.map((s) => (
              <Link
                key={s.id}
                to={`/services/${s.id}`}
                className="group flex h-full flex-col gap-3 rounded-2xl border border-border bg-surface p-5 transition-all duration-200 hover:-translate-y-1 hover:border-orange-400/40"
              >
                <div className="flex items-start justify-between gap-3">
                  <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-orange-400/10">
                    <s.icon className="h-5 w-5 text-orange-400" strokeWidth={2.25} />
                  </span>
                  <span className="rounded-full border border-border px-2.5 py-1 text-xs font-medium text-fg-faint">
                    {s.billing === "monthly" ? "Monthly" : "One-time"}
                  </span>
                </div>
                <div>
                  <h2 className="font-display text-base font-semibold text-fg">{s.name}</h2>
                  <p className="mt-1 text-sm text-fg-muted">{s.summary}</p>
                </div>
                <p className="mt-auto flex items-center gap-2 pt-2 font-display text-lg font-semibold text-orange-400">
                  {formatPrice(s)}
                  <ArrowRight className="h-4 w-4 opacity-0 transition-opacity group-hover:opacity-100" />
                </p>
              </Link>
            ))}
          </div>
        )}
      </section>
    </PublicShell>
  );
}

function FilterChip({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={`rounded-full border-2 px-3.5 py-2 text-xs font-semibold transition-colors ${
        active
          ? "border-orange-400 bg-orange-400/10 text-fg"
          : "border-border bg-surface text-fg-muted hover:border-orange-400/40"
      }`}
    >
      {children}
    </button>
  );
}
