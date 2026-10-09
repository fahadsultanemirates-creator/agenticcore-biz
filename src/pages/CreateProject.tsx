import { ArrowRight, Check, Loader2, MessageSquare, Package, Sparkles } from "lucide-react";
import { useMemo, useState, type FormEvent } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { Logo } from "../components/Logo";
import { activeServices, categories, formatPrice, packages } from "../data/catalog";

/**
 * Create a Project with Forge.
 *
 * WHAT THIS DOES TODAY, stated plainly because the brief insists on it
 * and because a CTA that leads nowhere is worse than no CTA.
 *
 * The structured brief below is the real, always-works path: it collects
 * the requirement, lets the customer attach the services they think they
 * need, and produces a brief they can send. The brief is explicit that
 * this manual form must function even when no AI provider is available,
 * so it is built first and does not depend on one.
 *
 * What it does NOT do yet: price the job, issue a quote, take payment,
 * or write a project row. forge-chat is a conversational endpoint --
 * actions 'message' and 'history', returning a reply -- and nothing in
 * it creates records. Claiming otherwise on screen would be selling a
 * capability that does not exist. Submitting therefore hands the brief
 * to a person, and the page says so.
 */

type Mode = "describe" | "service" | "package";

const CROSS_SITE = [
  {
    match: /\b(logo|poster|flyer|thumbnail|banner|short video|quick video|single image|business card)\b/i,
    site: "AgenticCore.click",
    href: "https://agenticcore.click",
    why: "That is a quick standardized creative task. .click does those cheaply and fast — .biz sells ongoing marketing management, not single pieces of artwork.",
  },
  {
    match: /\b(custom website|web app|web application|dashboard|e-?commerce|online shop|api|integration|multi-?agent|ai agent|automation framework|mobile app)\b/i,
    site: "AgenticCore.agency",
    href: "https://agenticcore.agency",
    why: "That is custom development. .agency builds those — .biz handles the business operations around them.",
  },
];

export function CreateProject() {
  const [params] = useSearchParams();
  const [mode, setMode] = useState<Mode>(params.get("mode") === "chat" ? "describe" : "describe");
  const [brief, setBrief] = useState(params.get("q") ?? "");
  const [budget, setBudget] = useState("");
  const [picked, setPicked] = useState<string[]>([]);
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [sending, setSending] = useState(false);

  // Routing advice, computed from what they typed. No AI call -- a
  // regex is enough to spot "I need a logo", and it works offline.
  const routed = useMemo(
    () => CROSS_SITE.find((r) => r.match.test(brief)),
    [brief]
  );

  const toggle = (id: string) =>
    setPicked((p) => (p.includes(id) ? p.filter((x) => x !== id) : [...p, id]));

  const composed = useMemo(() => {
    const lines = ["AgenticCore.biz — project brief", ""];
    if (brief.trim()) lines.push("What I need:", brief.trim(), "");
    if (picked.length) {
      lines.push("Services I think I need:");
      for (const id of picked) {
        const s = activeServices.find((x) => x.id === id);
        if (s) lines.push(`  - ${s.id} ${s.name} (${formatPrice(s)})`);
      }
      lines.push("");
    }
    if (budget.trim()) lines.push(`Rough budget: ${budget.trim()}`, "");
    return lines.join("\n");
  }, [brief, picked, budget]);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setSending(true);
    // Nothing is persisted yet -- see the note at the top of this file.
    // The brief is handed over by email, which is a real, working route
    // rather than a pretend one.
    await new Promise((r) => setTimeout(r, 300));
    setSending(false);
    setSent(true);
  };

  return (
    <div className="min-h-dvh bg-void">
      <header className="sticky top-0 z-40 border-b border-border bg-void/90 backdrop-blur">
        <div className="mx-auto flex max-w-4xl items-center gap-3 px-4 py-3 sm:px-6">
          <a href="/" aria-label="AgenticCore Biz home">
            <Logo compact />
          </a>
          <span className="ml-auto flex items-center gap-1.5 rounded-full border border-orange-400/40 bg-orange-400/10 px-3 py-1.5 text-xs font-semibold text-orange-400">
            <Sparkles className="h-3.5 w-3.5" />
            Forge
          </span>
        </div>
      </header>

      <main className="mx-auto max-w-4xl px-4 pb-28 sm:px-6">
        <section className="py-10 sm:py-14">
          <h1 className="font-display text-3xl font-semibold text-fg sm:text-4xl">
            Create a project
          </h1>
          <p className="mt-3 max-w-2xl text-fg-muted">
            Describe what you are trying to get done. We turn it into a structured brief, suggest
            the services that fit, and come back with a scope and a price for you to approve.
          </p>

          {/* The three entry points from the brief. */}
          <div className="mt-8 grid gap-3 sm:grid-cols-3">
            {([
              ["describe", MessageSquare, "Describe my business need"],
              ["service", Check, "Choose an existing service"],
              ["package", Package, "Build a support package"],
            ] as const).map(([key, Icon, label]) => (
              <button
                key={key}
                type="button"
                onClick={() => setMode(key)}
                className={`flex items-center gap-2.5 rounded-xl border-2 p-4 text-left text-sm font-semibold transition-colors ${
                  mode === key
                    ? "border-orange-400 bg-orange-400/5 text-fg"
                    : "border-border bg-surface text-fg-muted hover:border-orange-400/40"
                }`}
              >
                <Icon className={`h-4.5 w-4.5 shrink-0 ${mode === key ? "text-orange-400" : ""}`} />
                {label}
              </button>
            ))}
          </div>
        </section>

        {sent ? (
          <section className="rounded-2xl border border-orange-400/30 bg-orange-400/5 p-7">
            <Check className="h-6 w-6 text-orange-400" />
            <h2 className="mt-3 font-display text-xl font-semibold text-fg">Brief ready to send</h2>
            <p className="mt-2 text-sm text-fg-muted">
              Copy it below and send it to us, or email it directly — we will come back with a scope,
              a timeline and a price to approve.
            </p>
            <pre className="mt-4 overflow-x-auto rounded-xl border border-border bg-void p-4 text-xs whitespace-pre-wrap text-fg-muted">
              {composed}
            </pre>
            <div className="mt-4 flex flex-wrap gap-3">
              <button
                type="button"
                onClick={() => navigator.clipboard?.writeText(composed).catch(() => {})}
                className="rounded-full border-2 border-border px-5 py-2.5 text-sm font-semibold text-fg transition-colors hover:border-orange-400/60"
              >
                Copy brief
              </button>
              <a
                href={`mailto:hello@agenticcore.biz?subject=${encodeURIComponent("Project brief")}&body=${encodeURIComponent(composed)}`}
                className="rounded-full bg-orange-400 px-5 py-2.5 text-sm font-semibold text-void transition-transform hover:-translate-y-0.5"
              >
                Email it to us
              </a>
            </div>
          </section>
        ) : (
          <form onSubmit={submit} className="flex flex-col gap-6">
            {mode === "describe" && (
              <div>
                <label htmlFor="brief" className="text-sm font-semibold text-fg">
                  What do you need?
                </label>
                <textarea
                  id="brief"
                  value={brief}
                  onChange={(e) => setBrief(e.target.value)}
                  rows={6}
                  placeholder="I am opening a small consulting company. I need a startup plan, invoice templates, customer records and help organizing my office tasks. My budget is around $100."
                  className="mt-2 w-full rounded-xl border-2 border-border bg-surface px-4 py-3 text-sm text-fg placeholder:text-fg-faint focus:border-orange-400 focus:outline-none"
                />

                {/* Routed to the right brand before they get further in.
                    Shown, never acted on silently -- the brief forbids
                    submitting an order on another site on their behalf. */}
                {routed && (
                  <div className="mt-3 rounded-xl border border-orange-400/30 bg-orange-400/5 p-4">
                    <p className="text-sm font-semibold text-fg">
                      That sounds like a job for {routed.site}
                    </p>
                    <p className="mt-1 text-sm text-fg-muted">{routed.why}</p>
                    <a
                      href={routed.href}
                      target="_blank"
                      rel="noreferrer"
                      className="mt-3 inline-flex items-center gap-2 rounded-full bg-orange-400 px-4 py-2 text-xs font-semibold text-void"
                    >
                      Continue on {routed.site}
                      <ArrowRight className="h-3.5 w-3.5" />
                    </a>
                    <p className="mt-2 text-xs text-fg-faint">
                      You can carry on here too — we will say what belongs where.
                    </p>
                  </div>
                )}
              </div>
            )}

            {mode === "package" && (
              <div>
                <p className="text-sm font-semibold text-fg">Which package fits?</p>
                <div className="mt-2 grid gap-2 sm:grid-cols-3">
                  {packages.map((p) => (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => setBrief(`I am interested in the ${p.name} package (${formatPrice(p)}).`)}
                      className="rounded-xl border-2 border-border bg-surface p-4 text-left transition-colors hover:border-orange-400/40"
                    >
                      <span className="block text-sm font-semibold text-fg">{p.name}</span>
                      <span className="mt-0.5 block text-sm font-semibold text-orange-400">
                        {formatPrice(p)}
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            <div>
              <p className="text-sm font-semibold text-fg">
                {mode === "service" ? "Pick the services you need" : "Any services you already know you want?"}
              </p>
              <p className="mt-1 text-xs text-fg-faint">Optional — we will suggest others if these are not right.</p>
              <div className="mt-3 flex flex-col gap-4">
                {categories.map((cat) => (
                  <div key={cat.id}>
                    <p className="text-xs font-semibold tracking-wide text-fg-muted uppercase">
                      {cat.label}
                    </p>
                    <div className="mt-2 flex flex-wrap gap-2">
                      {activeServices
                        .filter((s) => s.category === cat.id)
                        .map((s) => (
                          <button
                            key={s.id}
                            type="button"
                            onClick={() => toggle(s.id)}
                            aria-pressed={picked.includes(s.id)}
                            className={`rounded-full border-2 px-3.5 py-2 text-xs font-medium transition-colors ${
                              picked.includes(s.id)
                                ? "border-orange-400 bg-orange-400/10 text-fg"
                                : "border-border bg-surface text-fg-muted hover:border-orange-400/40"
                            }`}
                          >
                            {s.name} · {formatPrice(s)}
                          </button>
                        ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label htmlFor="budget" className="text-sm font-semibold text-fg">
                  Rough budget <span className="font-normal text-fg-faint">(optional)</span>
                </label>
                <input
                  id="budget"
                  value={budget}
                  onChange={(e) => setBudget(e.target.value)}
                  placeholder="around $100"
                  className="mt-2 w-full rounded-xl border-2 border-border bg-surface px-4 py-2.5 text-sm text-fg placeholder:text-fg-faint focus:border-orange-400 focus:outline-none"
                />
              </div>
              <div>
                <label htmlFor="email" className="text-sm font-semibold text-fg">
                  Email <span className="font-normal text-fg-faint">(optional)</span>
                </label>
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@business.com"
                  className="mt-2 w-full rounded-xl border-2 border-border bg-surface px-4 py-2.5 text-sm text-fg placeholder:text-fg-faint focus:border-orange-400 focus:outline-none"
                />
              </div>
            </div>

            <div>
              <button
                type="submit"
                disabled={sending || (!brief.trim() && picked.length === 0)}
                className="inline-flex items-center gap-2 rounded-full bg-orange-400 px-7 py-3.5 text-base font-semibold text-void shadow-glow-orange transition-transform hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {sending && <Loader2 className="h-4 w-4 animate-spin" />}
                {sending ? "Preparing…" : "Prepare my brief"}
                {!sending && <ArrowRight className="h-4 w-4" />}
              </button>
              <p className="mt-3 max-w-xl text-xs text-fg-faint">
                This prepares a structured brief for us to scope and price. Nothing is charged, and
                no order is placed — you will see the scope, timeline and final price to approve
                first.{" "}
                <Link to="/" className="text-orange-400 hover:underline">
                  Back to the services
                </Link>
              </p>
            </div>
          </form>
        )}
      </main>
    </div>
  );
}
