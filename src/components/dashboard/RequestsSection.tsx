import { FileText, Inbox } from "lucide-react";
import { Link } from "react-router-dom";
import { serviceById } from "../../data/catalog";
import { statusLabel, type RequestRow } from "../../lib/dashboardData";
import { money } from "../../lib/payment";
import { Panel, StatusPill } from "./primitives";
import { UsdtPanel } from "./UsdtPanel";

/**
 * Requests that have not yet become projects.
 *
 * A request sits in one of three states and each needs something different
 * from the client: `draft` needs nothing but patience, `awaiting_payment`
 * needs a deposit, `confirmed` is about to open as a project. The payment
 * panel appears on exactly the middle one, and only when a price has
 * actually been agreed -- the same condition the legacy dashboard used, for
 * the same reason: there is nothing to pay 30% of until somebody has
 * quoted it.
 */
export function RequestsSection({
  requests,
  loading,
  failed,
  reload,
}: {
  requests: RequestRow[];
  loading: boolean;
  failed: boolean;
  reload: () => Promise<void>;
}) {
  // A confirmed request has a project; the projects page is where it belongs.
  const open = requests.filter((request) => request.status !== "confirmed");

  return (
    <section className="border-t border-border py-8 sm:py-10">
      <h2 className="font-display text-xl font-semibold text-fg sm:text-2xl">Open requests</h2>
      <p className="mt-1 text-sm text-fg-muted">
        What you've asked for that hasn't started yet.
      </p>

      <Panel
        loading={loading}
        failed={failed}
        reload={reload}
        empty={open.length === 0}
        emptyIcon={Inbox}
        emptyText="No open requests. Pick a service above and we'll scope it with you."
      >
        <div className="mt-5 flex flex-col gap-3">
          {open.map((request) => {
            const service = serviceById(request.task_type);
            const price = request.agreed_price === null ? null : Number(request.agreed_price);
            return (
              <article
                key={request.id}
                className="rounded-2xl border border-border bg-surface p-4 sm:p-5"
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="font-display text-base font-semibold text-fg">
                      {service?.name ?? request.task_type}
                    </p>
                    <p className="mt-0.5 text-xs text-fg-faint">
                      {request.service_category} · asked{" "}
                      {new Date(request.created_at).toLocaleDateString()}
                    </p>
                  </div>
                  <StatusPill status={request.status} />
                </div>

                <p className="mt-3 text-sm whitespace-pre-wrap text-fg-muted">
                  {request.description}
                </p>

                {price === null ? (
                  <p className="mt-3 text-xs text-fg-faint">
                    No price yet — we'll come back with scope and a figure.
                  </p>
                ) : (
                  <p className="mt-3 text-sm text-fg-muted">
                    Agreed price <span className="font-semibold text-fg">{money(price)}</span>
                  </p>
                )}

                {request.status === "awaiting_payment" && price !== null ? (
                  <UsdtPanel agreedPrice={price} />
                ) : null}

                {service ? (
                  <Link
                    to={`/services/${service.id}`}
                    className="mt-3 inline-flex items-center gap-1.5 text-xs font-semibold text-orange-400 hover:underline"
                  >
                    <FileText className="h-3.5 w-3.5" /> What this includes
                  </Link>
                ) : null}
              </article>
            );
          })}
        </div>
      </Panel>

      {/* Confirmed requests are not shown above, so say where they went
          rather than letting one silently vanish from this list. */}
      {requests.some((request) => request.status === "confirmed") ? (
        <p className="mt-4 text-xs text-fg-faint">
          Confirmed requests have become projects —{" "}
          <Link to="/projects" className="font-semibold text-orange-400 hover:underline">
            see them in your projects
          </Link>
          . {statusLabel("confirmed")} work is managed there.
        </p>
      ) : null}
    </section>
  );
}
