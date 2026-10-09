import { AlertTriangle, ArrowRight, Check, Clock } from "lucide-react";
import { useState, type FormEvent } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { DashboardShell } from "../components/dashboard/DashboardShell";
import { categories, formatPrice, needsQuote, serviceById } from "../data/catalog";
import { NotFound } from "./NotFound";
import { supabase } from "../lib/supabase";

/**
 * Asking for one service. The only screen on the dashboard that writes.
 *
 * It inserts into `requests`, where the client's own insert policy allows
 * exactly one thing: a row whose user_id is their own. Three deliberate
 * choices about what gets written:
 *
 *   agreed_price is left NULL. The catalogue price is what we advertise, not
 *   what has been agreed, and this table's price column is the figure the
 *   invoice is built from. Writing the list price here would let a client
 *   set their own price on a quoted job -- and for BIZ-10 and BIZ-13, whose
 *   published figures are floors, it would be wrong even in good faith.
 *
 *   task_type is the catalogue id, not the name. Names get reworded;
 *   BIZ-07 does not. It is what serviceById() looks up to render a request
 *   later, and the reason a retired service's old orders still read
 *   correctly.
 *
 *   status is left to its default of 'draft'. Nothing a client submits is
 *   awaiting payment until a human has scoped it.
 */
export function RequestService() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const service = id ? serviceById(id) : undefined;

  const [description, setDescription] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  // An unknown or retired id is a 404, not a blank form. /services/:id
  // explains retirements; this page only takes orders for live services.
  if (!service) return <NotFound />;

  const category = categories.find((c) => c.id === service.category);
  const quoteOnly = needsQuote(service);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (description.trim().length < 20) {
      setError("Tell us a little more — a sentence or two about your situation is enough.");
      return;
    }
    setError("");
    setSubmitting(true);

    const { data: session } = await supabase.auth.getSession();
    const userId = session.session?.user.id;
    if (!userId) {
      setSubmitting(false);
      setError("Your session expired. Please sign in again.");
      return;
    }

    const { error: insertError } = await supabase.from("requests").insert({
      user_id: userId,
      service_category: category?.label ?? service.category,
      task_type: service.id,
      description: description.trim(),
    });

    setSubmitting(false);
    if (insertError) {
      console.error("Creating request failed:", insertError.message);
      setError("We couldn't send that just now. Please try again.");
      return;
    }
    navigate("/dashboard", { replace: true });
  };

  return (
    <DashboardShell title={service.name}>
      <section className="py-8">
        <div className="mx-auto max-w-2xl">
          <div className="flex items-start gap-3">
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-orange-400/10">
              <service.icon className="h-5 w-5 text-orange-400" strokeWidth={2.25} />
            </span>
            <div className="min-w-0">
              <h1 className="font-display text-2xl font-semibold text-fg">{service.name}</h1>
              <p className="mt-1 text-sm text-fg-muted">{service.summary}</p>
            </div>
          </div>

          <div className="mt-5 flex flex-wrap items-center gap-x-5 gap-y-2 text-sm">
            <span className="font-display text-lg font-semibold text-orange-400">
              {formatPrice(service)}
            </span>
            <span className="flex items-center gap-1.5 text-fg-muted">
              <Clock className="h-3.5 w-3.5" /> {service.deliveryEstimate}
            </span>
            <span className="text-fg-muted">
              {service.revisions === 0
                ? "No revision round"
                : `${service.revisions} revision round`}
            </span>
          </div>

          {quoteOnly ? (
            <p className="mt-4 flex items-start gap-2 rounded-xl border border-orange-400/30 bg-orange-400/5 p-3 text-sm text-fg-muted">
              <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-orange-400" />
              <span>
                {formatPrice(service)} is a starting point, not the price. This one depends on
                volume, so we'll quote it once we know what we're looking at.
              </span>
            </p>
          ) : null}

          <div className="mt-6 rounded-2xl border border-border bg-surface p-5">
            <p className="text-xs font-semibold tracking-wide text-fg-muted uppercase">
              What we'll need from you
            </p>
            <ul className="mt-2 flex flex-col gap-1.5">
              {service.customerInputs.map((input) => (
                <li key={input} className="flex items-start gap-2 text-sm text-fg-muted">
                  <Check className="mt-0.5 h-3.5 w-3.5 shrink-0 text-orange-400" />
                  {input}
                </li>
              ))}
            </ul>
            <p className="mt-3 text-xs text-fg-faint">
              Not now — we'll ask for these once the scope is agreed.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="mt-6">
            <label className="flex flex-col gap-1.5">
              <span className="text-xs font-semibold tracking-wide text-fg-muted uppercase">
                Tell us about your situation
              </span>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={6}
                autoFocus
                placeholder="What the business does, where you are now, and what you need out of this."
                className="rounded-xl border-2 border-border bg-void px-3.5 py-2.5 text-fg placeholder:text-fg-faint focus:border-orange-400 focus:outline-none"
              />
            </label>

            {error ? <p className="mt-2 text-sm text-orange-300">{error}</p> : null}

            <p className="mt-3 text-xs text-fg-faint">
              Sending this doesn't charge anything. We read it, come back with scope and a price,
              and only then is there a deposit to pay.
            </p>

            <div className="mt-4 flex flex-wrap items-center gap-3">
              <button
                type="submit"
                disabled={submitting}
                className="inline-flex items-center justify-center gap-2 rounded-full bg-orange-400 px-5 py-3 text-sm font-semibold text-void shadow-glow-orange transition-transform hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {submitting ? "Sending…" : quoteOnly ? "Request a quote" : "Send request"}
                <ArrowRight className="h-4 w-4" />
              </button>
              <Link
                to={`/services/${service.id}`}
                className="text-sm font-semibold text-fg-muted hover:text-fg hover:underline"
              >
                Read the full scope first
              </Link>
            </div>
          </form>
        </div>
      </section>
    </DashboardShell>
  );
}
