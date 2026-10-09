import { ArrowRight, MessageSquare, Sparkles } from "lucide-react";
import { Link } from "react-router-dom";
import { Reveal } from "../Reveal";

const PROMPTS = [
  "I am starting a small consulting business and need help organizing everything.",
  "I need invoices, expense tracking and monthly financial reports.",
  "Help me manage customer enquiries and follow-ups.",
  "I need office procedures and a virtual back-office setup.",
  "My business needs a structured monthly marketing plan.",
];

export function ForgeSection() {
  return (
    <section id="forge" className="border-t border-border bg-surface/40 py-20 md:py-28">
      <div className="mx-auto max-w-5xl px-6">
        <div className="mx-auto max-w-2xl text-center">
          <span className="inline-flex items-center gap-2 rounded-full border border-orange-400/40 bg-orange-400/10 px-4 py-1.5 text-xs font-semibold text-orange-400">
            <Sparkles className="h-3.5 w-3.5" />
            Forge
          </span>
          <h2 className="mt-5 font-display text-3xl font-semibold text-fg sm:text-4xl">
            Not sure which service you need? Tell Forge about your business.
          </h2>
          <p className="mt-4 text-fg-muted">
            Describe what you want to achieve in your own words. Forge helps turn your requirements
            into a structured project, suggests the right services and prepares the next steps.
          </p>
        </div>

        <Reveal className="mt-12">
          <div className="rounded-2xl border border-border bg-void p-5 sm:p-7">
            <p className="text-xs font-semibold tracking-wide text-fg-faint uppercase">
              For example
            </p>
            <ul className="mt-4 flex flex-col gap-2.5">
              {PROMPTS.map((prompt) => (
                <li key={prompt}>
                  <Link
                    to={`/create-project?q=${encodeURIComponent(prompt)}`}
                    className="group flex items-start gap-3 rounded-xl border border-border bg-surface px-4 py-3 text-left text-sm text-fg-muted transition-colors hover:border-orange-400/50 hover:text-fg"
                  >
                    <MessageSquare className="mt-0.5 h-4 w-4 shrink-0 text-orange-400" />
                    <span>“{prompt}”</span>
                    <ArrowRight className="mt-0.5 ml-auto h-4 w-4 shrink-0 text-fg-faint transition-colors group-hover:text-orange-400" />
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </Reveal>

        <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
          <Link
            to="/create-project"
            className="group inline-flex items-center gap-2 rounded-full bg-orange-400 px-7 py-3.5 text-base font-semibold text-void shadow-glow-orange transition-transform hover:-translate-y-0.5"
          >
            Create My Project
            <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
          </Link>
          <Link
            to="/create-project?mode=chat"
            className="inline-flex items-center gap-2 rounded-full border-2 border-border px-7 py-3.5 text-base font-semibold text-fg transition-colors hover:border-orange-400/60"
          >
            <MessageSquare className="h-4 w-4 text-orange-400" />
            Chat with Forge
          </Link>
        </div>

        {/* What Forge is, stated where somebody is about to rely on it.
            It drafts; a person prices and approves. */}
        <p className="mx-auto mt-6 max-w-2xl text-center text-xs text-fg-faint">
          Forge prepares a brief and suggests services from our published catalog. It does not issue
          final quotes or take payment — scope, price and timeline are confirmed by us before you pay
          anything.
        </p>
      </div>
    </section>
  );
}
