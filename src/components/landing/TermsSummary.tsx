import { Reveal } from "../Reveal";

// The things worth knowing before signing up, said plainly. The full
// terms and the privacy policy are still their own pages; this is the
// part people actually need.
const POINTS = [
  {
    heading: "Discovery comes first, always",
    body: "We won't start marketing for any business without understanding its goals and requirements first — no exceptions, whichever service you pick. It is the whole difference between a plan and a posting schedule.",
  },
  {
    heading: "Published prices are ranges, and honestly so",
    body: "A chatbot is $209–$419 because a chatbot for a dentist is not a chatbot for a developer. The sheet shows the real span; discovery settles which end you are at, and you see that number before you pay.",
  },
  {
    heading: "No credits, no bundles, no expiry",
    body: "À la carte only. You buy a service, not a balance that runs down whether it worked or not — and nothing auto-renews into work you did not ask for.",
  },
  {
    heading: "Monthly work is monthly work",
    body: "Several services are run month to month, and the sheet says so next to the price. You are told what recurs and what is one-off before anything starts, not on the second invoice.",
  },
];

export function TermsSummary() {
  return (
    <section id="terms" className="bg-surface/40 py-20 md:py-28">
      <div className="mx-auto max-w-5xl px-6">
        <div className="mx-auto mb-14 max-w-2xl text-center">
          <h2 className="font-display text-4xl font-semibold tracking-tight text-fg sm:text-5xl">
            Before you sign up
          </h2>
          <p className="mt-4 text-fg-muted">
            The short version. The{" "}
            <a href="/terms.html" className="font-semibold text-orange-400 hover:underline">
              full terms
            </a>{" "}
            and the{" "}
            <a href="/privacy.html" className="font-semibold text-orange-400 hover:underline">
              privacy policy
            </a>{" "}
            are each a page of their own.
          </p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          {POINTS.map((point, i) => (
            <Reveal key={point.heading} delay={(i % 2) * 80} className="h-full">
              <div className="flex h-full flex-col gap-2 rounded-2xl border border-border bg-surface p-6">
                <h3 className="font-display text-lg font-semibold text-fg">{point.heading}</h3>
                <p className="text-sm text-fg-muted">{point.body}</p>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
