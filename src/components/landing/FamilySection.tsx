import { ArrowUpRight, Briefcase, Code2, Zap } from "lucide-react";
import { Link } from "react-router-dom";
import { Reveal } from "../Reveal";

/**
 * The three brands, and what each one is actually for.
 *
 * The point is to stop somebody buying the wrong thing from the wrong
 * site: a $5 logo bought as a business service, or a custom dashboard
 * ordered as back-office support. Each card says what it is FOR, not
 * just what it is called.
 */
const FAMILY = [
  {
    key: "click",
    icon: Zap,
    name: "AgenticCore.click",
    headline: "Need something done quickly?",
    body: "Simple websites, images, documents, logos, videos and other quick digital tasks — with affordable prices and fast estimated turnaround for eligible services.",
    note: "Selected standardized services can be ready in as little as 20 minutes, depending on the task.",
    cta: "Explore AgenticCore.click",
    href: "https://agenticcore.click",
    external: true,
  },
  {
    key: "agency",
    icon: Code2,
    name: "AgenticCore.agency",
    headline: "Need something custom-built?",
    body: "Professional websites, complex dashboards, web applications, e-commerce systems, AI agents and automation frameworks — designed for larger technical requirements.",
    note: null,
    cta: "Explore AgenticCore.agency",
    href: "https://agenticcore.agency",
    external: true,
  },
  {
    key: "biz",
    icon: Briefcase,
    name: "AgenticCore.biz",
    headline: "Need help running your business?",
    body: "Startup planning, administration, records, operational workflows, business reports and ongoing managed support.",
    note: "You are here.",
    cta: "Explore Business Services",
    href: "/services",
    external: false,
  },
];

export function FamilySection() {
  return (
    <section id="family" className="border-t border-border py-20 md:py-28">
      <div className="mx-auto max-w-6xl px-6">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="font-display text-3xl font-semibold text-fg sm:text-4xl">
            Different business needs. One connected AgenticCore family.
          </h2>
          <p className="mt-4 text-fg-muted">
            Three specialist sites, not three names for the same thing. Picking the right one is the
            difference between a job that fits and a job that does not.
          </p>
        </div>

        <div className="mt-14 grid gap-4 lg:grid-cols-3">
          {FAMILY.map((brand, i) => (
            <Reveal key={brand.key} delay={i * 80} className="h-full">
              <div
                className={`flex h-full flex-col gap-3 rounded-2xl border p-6 ${
                  brand.key === "biz" ? "border-orange-400/40 bg-orange-400/5" : "border-border bg-surface"
                }`}
              >
                <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-orange-400/10">
                  <brand.icon className="h-5 w-5 text-orange-400" strokeWidth={2.25} />
                </span>
                <p className="text-xs font-semibold tracking-wide text-fg-faint uppercase">
                  {brand.name}
                </p>
                <h3 className="font-display text-lg font-semibold text-fg">{brand.headline}</h3>
                <p className="text-sm text-fg-muted">{brand.body}</p>
                {brand.note && <p className="text-xs text-fg-faint">{brand.note}</p>}

                {brand.external ? (
                  <a
                    href={brand.href}
                    target="_blank"
                    rel="noreferrer"
                    className="group mt-auto inline-flex w-fit items-center gap-2 rounded-full border-2 border-border px-5 py-2.5 text-sm font-semibold text-fg transition-colors hover:border-orange-400/60"
                  >
                    {brand.cta}
                    <ArrowUpRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
                  </a>
                ) : (
                  <Link
                    to={brand.href}
                    className="mt-auto inline-flex w-fit items-center gap-2 rounded-full bg-orange-400 px-5 py-2.5 text-sm font-semibold text-void transition-transform hover:-translate-y-0.5"
                  >
                    {brand.cta}
                  </Link>
                )}
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
