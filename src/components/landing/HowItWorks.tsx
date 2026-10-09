import { ClipboardCheck, FileSearch, Rocket, Send } from "lucide-react";
import { Reveal } from "../Reveal";

// The four steps from how-it-works.html, in the site's own words. The
// order is the pitch: nothing is made until step three is signed off.
const STEPS = [
  {
    icon: Send,
    title: "Tell us about your business",
    body: "Product, website, competitors — the basics we need before recommending anything.",
  },
  {
    icon: FileSearch,
    title: "We assess, then plan",
    body: "No results without a real look at what you're selling and who you're up against.",
  },
  {
    icon: ClipboardCheck,
    title: "Approve your plan & pay",
    body: "One clear plan, scoped to your business, with the real number on it — not a range.",
  },
  {
    icon: Rocket,
    title: "We run it and report",
    body: "Content, posting and monitoring, end to end, with the numbers visible in your dashboard.",
  },
];

export function HowItWorks() {
  return (
    <section id="how-it-works" className="border-t border-border py-20 md:py-28">
      <div className="mx-auto max-w-6xl px-6">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="font-display text-3xl font-semibold text-fg sm:text-4xl">
            No results without a plan, in four steps
          </h2>
          <p className="mt-4 text-fg-muted">
            We won't start marketing for any business without understanding its goals first — no
            exceptions, whichever service you pick.
          </p>
        </div>

        <ol className="mt-14 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {STEPS.map((step, i) => (
            <Reveal key={step.title} delay={i * 80} className="h-full">
              <li className="flex h-full flex-col gap-3 rounded-2xl border border-border bg-surface p-6">
                <div className="flex items-center justify-between">
                  <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-orange-400/10">
                    <step.icon className="h-5 w-5 text-orange-400" strokeWidth={2.25} />
                  </span>
                  <span className="font-display text-sm font-semibold text-fg-faint">
                    {String(i + 1).padStart(2, "0")}
                  </span>
                </div>
                <h3 className="font-display text-lg font-semibold text-fg">{step.title}</h3>
                <p className="text-sm text-fg-muted">{step.body}</p>
              </li>
            </Reveal>
          ))}
        </ol>
      </div>
    </section>
  );
}
