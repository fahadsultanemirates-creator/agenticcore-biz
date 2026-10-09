import { ArrowRight } from "lucide-react";

export function CtaBanner() {
  return (
    <section className="border-t border-border py-20 md:py-28">
      <div className="mx-auto max-w-3xl px-6 text-center">
        <h2 className="font-display text-3xl font-semibold text-fg sm:text-4xl">
          Ready to grow with a plan behind it?
        </h2>
        <p className="mt-4 text-fg-muted">
          Sign up, tell us about your business, and get a scoped plan back — product, website and
          competitors looked at before anything is recommended.
        </p>
        <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
          <a
            href="/signup.html"
            className="group inline-flex items-center gap-2 rounded-full bg-orange-400 px-7 py-3.5 text-base font-semibold text-void shadow-glow-orange transition-transform hover:-translate-y-0.5"
          >
            Get started free
            <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
          </a>
          <a
            href="/how-it-works.html#discovery"
            className="inline-flex items-center gap-2 rounded-full border-2 border-border px-7 py-3.5 text-base font-semibold text-fg transition-colors hover:border-orange-400/60"
          >
            Talk it through first
          </a>
        </div>
      </div>
    </section>
  );
}
