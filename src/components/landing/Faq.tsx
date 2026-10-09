import { useState } from "react";
import { ChevronDown } from "lucide-react";

const FAQS = [
  {
    q: "Can I order one service without a package?",
    a: "Yes. Services are available individually. Packages are optional.",
  },
  {
    q: "Do I need a meeting before ordering?",
    a: "Most straightforward tasks can begin through the online requirements workflow. Complex services may require clarification.",
  },
  {
    q: "Are the published prices final?",
    a: "Fixed-price standard services have defined scopes. Larger or variable projects receive a clear quotation for approval before payment — those are the ones shown as “from”.",
  },
  {
    q: "Can I order services monthly?",
    a: "Yes. Selected services are billed per service month with their terms and deliverables shown clearly.",
  },
  {
    q: "Does AgenticCore.biz register companies or provide legal advice?",
    a: "No. We provide planning, preparation and administrative assistance. Regulated legal, accounting and filing activities require appropriate professionals.",
  },
  {
    q: "Can you build my website or custom AI system?",
    a: "AgenticCore.agency specializes in custom development. AgenticCore.click offers selected quick digital tasks.",
  },
  {
    q: "Can I track my project?",
    a: "Yes, through the customer dashboard and available project updates.",
  },
  {
    q: "Are third-party platform and advertising costs included?",
    a: "Only when explicitly listed in the service scope. External subscriptions, advertising budgets and platform charges are otherwise separate.",
  },
  {
    q: "What does Forge do?",
    a: "Forge helps customers understand their requirements, identify relevant services and prepare structured project briefs.",
  },
  {
    q: "Do I own the completed work?",
    a: "Ownership and usage rights are governed by the agreed project scope and terms, including any third-party license restrictions.",
  },
];

export function Faq() {
  // Native <details> would be fewer lines, but its open/close is not
  // animatable and the chevron cannot be driven from it without the same
  // state anyway.
  const [open, setOpen] = useState<number | null>(0);

  return (
    <section id="faq" className="border-t border-border py-20 md:py-28">
      <div className="mx-auto max-w-3xl px-6">
        <h2 className="text-center font-display text-3xl font-semibold text-fg sm:text-4xl">
          Questions, answered
        </h2>

        <div className="mt-12 flex flex-col gap-2">
          {FAQS.map((faq, i) => {
            const isOpen = open === i;
            return (
              <div key={faq.q} className="overflow-hidden rounded-2xl border border-border bg-surface">
                <h3>
                  <button
                    type="button"
                    onClick={() => setOpen(isOpen ? null : i)}
                    aria-expanded={isOpen}
                    aria-controls={`faq-panel-${i}`}
                    className="flex w-full items-center justify-between gap-4 px-5 py-4 text-left transition-colors hover:bg-surface-2"
                  >
                    <span className="text-sm font-semibold text-fg">{faq.q}</span>
                    <ChevronDown
                      className={`h-4 w-4 shrink-0 text-orange-400 transition-transform duration-200 ${
                        isOpen ? "rotate-180" : ""
                      }`}
                    />
                  </button>
                </h3>
                {isOpen && (
                  <div id={`faq-panel-${i}`} className="px-5 pb-4 text-sm text-fg-muted">
                    {faq.a}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
