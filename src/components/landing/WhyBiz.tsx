import { Check } from "lucide-react";
import { Reveal } from "../Reveal";

const BENEFITS = [
  "Affordable and transparent pricing",
  "AI-assisted workflows",
  "Clear tasks and deliverables",
  "One place for projects and business records",
  "Optional ongoing monthly support",
  "Visibility into work status",
];

export function WhyBiz() {
  return (
    <section className="border-t border-border py-20 md:py-28">
      <div className="mx-auto max-w-5xl px-6">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="font-display text-3xl font-semibold text-fg sm:text-4xl">
            Business support without the traditional overhead.
          </h2>
        </div>

        <div className="mt-12 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {BENEFITS.map((benefit, i) => (
            <Reveal key={benefit} delay={(i % 3) * 80} className="h-full">
              <div className="flex h-full items-start gap-3 rounded-2xl border border-border bg-surface p-5">
                <Check className="mt-0.5 h-4.5 w-4.5 shrink-0 text-orange-400" strokeWidth={2.5} />
                <p className="text-sm font-medium text-fg">{benefit}</p>
              </div>
            </Reveal>
          ))}
        </div>

        {/* The brief is explicit: AI is an efficiency claim, not an
            autonomy claim or a guarantee. Said here rather than left to
            the reader, because "AI-assisted workflows" above invites
            exactly the wrong inference. */}
        <p className="mx-auto mt-10 max-w-2xl text-center text-sm text-fg-muted">
          We use AI to work faster and keep things consistent — not to run your business unattended.
          People review the work that matters, and no outcome is guaranteed.
        </p>
      </div>
    </section>
  );
}
