import { AlertTriangle, ArrowRight, Check, Clock, FileInput, RefreshCw, Sparkles, X } from "lucide-react";
import { Link, useParams } from "react-router-dom";
import { PublicShell } from "../components/PublicShell";
import { archivedById, formatPrice, needsQuote, serviceById } from "../data/catalog";

export function ServiceDetail() {
  const { id = "" } = useParams();
  const service = serviceById(id);

  // A retired service gets an answer, not a 404. Somebody following an
  // old link or an old invoice should be told what happened to it and
  // where its successor is.
  if (!service || service.status === "archived") {
    const retired = archivedById(id) ?? (service ? { name: service.name, note: "Retired.", replacedBy: undefined } : null);
    return (
      <PublicShell title={retired ? "Service retired" : "Service not found"} backTo="/services" backLabel="Services">
        <section className="py-16">
          <AlertTriangle className="h-7 w-7 text-orange-400" />
          <h1 className="mt-4 font-display text-2xl font-semibold text-fg">
            {retired ? `${retired.name} is no longer offered` : "We could not find that service"}
          </h1>
          <p className="mt-2 max-w-xl text-fg-muted">{retired?.note ?? "It may have been renamed or retired."}</p>
          <div className="mt-6 flex flex-wrap gap-3">
            {retired && "replacedBy" in retired && retired.replacedBy && (
              <Link
                to={`/services/${retired.replacedBy}`}
                className="rounded-full bg-orange-400 px-5 py-2.5 text-sm font-semibold text-void"
              >
                See what replaced it
              </Link>
            )}
            <Link
              to="/services"
              className="rounded-full border-2 border-border px-5 py-2.5 text-sm font-semibold text-fg transition-colors hover:border-orange-400/60"
            >
              Browse all services
            </Link>
          </div>
        </section>
      </PublicShell>
    );
  }

  const quoted = needsQuote(service);

  return (
    <PublicShell title={service.name} backTo="/services" backLabel="Services">
      <section className="py-10 sm:py-14">
        <div className="flex flex-wrap items-center gap-2">
          <span className="rounded-full border border-border px-2.5 py-1 text-xs font-medium text-fg-faint">
            {service.id}
          </span>
          <span className="rounded-full border border-border px-2.5 py-1 text-xs font-medium text-fg-faint">
            {service.billing === "monthly" ? "Billed monthly" : "One-time"}
          </span>
        </div>

        <h1 className="mt-4 font-display text-3xl font-semibold text-fg sm:text-4xl">
          {service.name}
        </h1>
        <p className="mt-3 max-w-2xl text-lg text-fg-muted">{service.summary}</p>

        <p className="mt-6 font-display text-4xl font-semibold text-orange-400">
          {formatPrice(service)}
        </p>
        {quoted && (
          // A "from" price is a floor. Saying so here, next to the
          // number, is what stops somebody expecting the floor to be the
          // bill.
          <p className="mt-2 max-w-xl text-sm text-fg-muted">
            This is a starting price. The work varies enough that we scope it first and send you a
            fixed quote to approve — you are never charged before you agree the number.
          </p>
        )}

        <div className="mt-8 grid gap-4 lg:grid-cols-2">
          <Panel icon={Check} title="What you get">
            <ul className="flex flex-col gap-2">
              {service.deliverables.map((d) => (
                <li key={d} className="flex items-start gap-2.5 text-sm text-fg-muted">
                  <Check className="mt-0.5 h-4 w-4 shrink-0 text-orange-400" />
                  {d}
                </li>
              ))}
            </ul>
          </Panel>

          <Panel icon={X} title="What this does not cover">
            <ul className="flex flex-col gap-2">
              {service.exclusions.map((d) => (
                <li key={d} className="flex items-start gap-2.5 text-sm text-fg-muted">
                  <X className="mt-0.5 h-4 w-4 shrink-0 text-fg-faint" />
                  {d}
                </li>
              ))}
            </ul>
          </Panel>

          <Panel icon={AlertTriangle} title="Scope of the base price">
            <ul className="flex flex-col gap-2">
              {service.scopeLimits.map((d) => (
                <li key={d} className="flex items-start gap-2.5 text-sm text-fg-muted">
                  <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-orange-400" />
                  {d}
                </li>
              ))}
            </ul>
          </Panel>

          <Panel icon={FileInput} title="What we need from you">
            <ul className="flex flex-col gap-2">
              {service.customerInputs.map((d) => (
                <li key={d} className="flex items-start gap-2.5 text-sm text-fg-muted">
                  <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-orange-400" />
                  {d}
                </li>
              ))}
            </ul>
          </Panel>
        </div>

        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <div className="flex items-center gap-3 rounded-2xl border border-border bg-surface p-5">
            <Clock className="h-5 w-5 shrink-0 text-orange-400" />
            <div>
              <p className="text-xs font-semibold tracking-wide text-fg-faint uppercase">Timeline</p>
              <p className="text-sm text-fg">{service.deliveryEstimate}</p>
            </div>
          </div>
          <div className="flex items-center gap-3 rounded-2xl border border-border bg-surface p-5">
            <RefreshCw className="h-5 w-5 shrink-0 text-orange-400" />
            <div>
              <p className="text-xs font-semibold tracking-wide text-fg-faint uppercase">Revisions</p>
              <p className="text-sm text-fg">
                {service.revisions === 0 ? "Ongoing service — adjusted as we go" : `${service.revisions} included`}
              </p>
            </div>
          </div>
        </div>

        <div className="mt-8 flex flex-col gap-3 sm:flex-row">
          <Link
            to={`/create-project?q=${encodeURIComponent(`I would like ${service.name} (${service.id}).`)}`}
            className="group inline-flex items-center justify-center gap-2 rounded-full bg-orange-400 px-7 py-3.5 text-base font-semibold text-void shadow-glow-orange transition-transform hover:-translate-y-0.5"
          >
            {quoted ? "Request a quote" : "Order this service"}
            <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
          </Link>
          <Link
            to={`/create-project?mode=chat&q=${encodeURIComponent(`I have a question about ${service.name}.`)}`}
            className="inline-flex items-center justify-center gap-2 rounded-full border-2 border-border px-7 py-3.5 text-base font-semibold text-fg transition-colors hover:border-orange-400/60"
          >
            <Sparkles className="h-4 w-4 text-orange-400" />
            Ask Forge
          </Link>
        </div>
      </section>
    </PublicShell>
  );
}

function Panel({
  icon: Icon,
  title,
  children,
}: {
  icon: typeof Check;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-2xl border border-border bg-surface p-6">
      <h2 className="mb-3 flex items-center gap-2 font-display text-base font-semibold text-fg">
        <Icon className="h-4 w-4 text-orange-400" />
        {title}
      </h2>
      {children}
    </div>
  );
}
