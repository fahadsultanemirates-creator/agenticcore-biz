import { BarChart3, Briefcase, TrendingUp, Workflow } from "lucide-react";
import { Reveal } from "../Reveal";

const CARDS = [
  {
    icon: Briefcase,
    title: "Plan & Launch",
    body: "Startup roadmaps, feasibility reports and focused market research.",
    href: "#services",
  },
  {
    icon: Workflow,
    title: "Organize Your Office",
    body: "Invoice templates, SOPs and administrative starter files.",
    href: "#services",
  },
  {
    icon: BarChart3,
    title: "Manage Your Numbers",
    body: "Reusable expense and cash-flow trackers with a usage guide.",
    href: "#services",
  },
  {
    icon: TrendingUp,
    title: "Support Your Growth",
    body: "One-time customer pipeline setup and professional business proposals.",
    href: "#services",
  },
];

export function WhatWeDo() {
  return (
    <section className="border-t border-border py-20 md:py-28">
      <div className="mx-auto max-w-6xl px-6">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="font-display text-3xl font-semibold text-fg sm:text-4xl">
            Your business needs more than a website.
          </h2>
          <p className="mt-4 text-fg-muted">
            Start with the plans, documents and templates your business needs.
            For ongoing department support, explore a managed office at AgenticCore Group.
          </p>
        </div>

        <div className="mt-14 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {CARDS.map((card, i) => (
            <Reveal key={card.title} delay={i * 80} className="h-full">
              <a
                href={card.href}
                className="group flex h-full flex-col gap-3 rounded-2xl border border-border bg-surface p-6 transition-all duration-200 hover:-translate-y-1 hover:border-orange-400/40"
              >
                <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-orange-400/10 transition-colors group-hover:bg-orange-400/20">
                  <card.icon className="h-5 w-5 text-orange-400" strokeWidth={2.25} />
                </span>
                <h3 className="font-display text-lg font-semibold text-fg">{card.title}</h3>
                <p className="text-sm text-fg-muted">{card.body}</p>
              </a>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
