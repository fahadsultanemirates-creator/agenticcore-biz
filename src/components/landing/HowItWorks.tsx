import { CheckCircle2, FileSearch, MessageSquare, PackageCheck } from "lucide-react";
import { Reveal } from "../Reveal";

/**
 * The real process, not an aspirational one.
 *
 * Step 2 says Forge "helps organize" and "prepares a proposed scope",
 * which is what it does. It deliberately does not say Forge prices the
 * job or issues the quote: a proposal becomes a price when a person
 * approves it, and claiming otherwise would be selling a capability that
 * is not built.
 */
const STEPS = [
  {
    icon: MessageSquare,
    title: "Choose a service or describe your project",
    body: "Pick something from the catalog, or just say what you are trying to get done.",
  },
  {
    icon: FileSearch,
    title: "Forge helps organize your requirements",
    body: "It asks the missing questions and turns your description into a structured brief with a proposed scope.",
  },
  {
    icon: CheckCircle2,
    title: "Review the final price and approve",
    body: "You see the scope, the deliverables, the timeline and the real number before anything is charged.",
  },
  {
    icon: PackageCheck,
    title: "Track progress and receive your work",
    body: "Follow the job in your dashboard and collect the deliverables there when it is done.",
  },
];

export function HowItWorks() {
  return (
    <section id="how-it-works" className="border-t border-border py-20 md:py-28">
      <div className="mx-auto max-w-6xl px-6">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="font-display text-3xl font-semibold text-fg sm:text-4xl">
            Four steps. Less administration. More progress.
          </h2>
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
                <h3 className="font-display text-base font-semibold text-fg">{step.title}</h3>
                <p className="text-sm text-fg-muted">{step.body}</p>
              </li>
            </Reveal>
          ))}
        </ol>
      </div>
    </section>
  );
}
