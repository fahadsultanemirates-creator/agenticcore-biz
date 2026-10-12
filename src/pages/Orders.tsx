import { AlertTriangle, FileText } from "lucide-react";
import { Link } from "react-router-dom";
import { DashboardNav } from "../components/dashboard/DashboardNav";
import { DashboardShell } from "../components/dashboard/DashboardShell";
import { Panel, StatusPill } from "../components/dashboard/primitives";
import { UsdtPanel } from "../components/dashboard/UsdtPanel";
import { serviceById, SERVICE_COUNT } from "../data/catalog";
import { useRequests, type RequestRow } from "../lib/dashboardData";
import { money, upfrontDue } from "../lib/payment";

/**
 * Every request ever made, newest first.
 *
 * The dashboard's own Open requests panel deliberately hides `confirmed`
 * ones, because once a request becomes a project the project is where it
 * is managed. That leaves a client with no way to look back at what they
 * ordered in March, which is what this page is for: the full history,
 * including the ones that have already become projects, with a link
 * across to each.
 *
 * The payment panel still renders on an order awaiting a deposit. It is
 * the same UsdtPanel the dashboard uses, not a copy -- a client reading
 * "deposit due" should be able to act on it here rather than being sent
 * somewhere else to find the address.
 */
export function Orders() {
  const requests = useRequests();

  return (
    <DashboardShell title="Orders">
      <DashboardNav />
      <section className="py-8">
        <h1 className="font-display text-2xl font-semibold text-fg sm:text-3xl">Orders</h1>
        <p className="mt-1.5 text-sm text-fg-muted">
          Everything you have asked for, newest first — including work that has already become a
          project.
        </p>

        <Panel
          loading={requests.loading}
          failed={requests.failed}
          reload={requests.reload}
          empty={requests.rows.length === 0}
          emptyIcon={FileText}
          emptyText={
            <>
              No orders yet.{" "}
              <Link to="/services" className="font-semibold text-orange-400 hover:underline">
                Browse the {SERVICE_COUNT} services
              </Link>{" "}
              and we&apos;ll scope one with you.
            </>
          }
        >
          <div className="mt-6 flex flex-col gap-3">
            {requests.rows.map((request) => (
              <OrderCard key={request.id} request={request} />
            ))}
          </div>
        </Panel>
      </section>
    </DashboardShell>
  );
}

function OrderCard({ request }: { request: RequestRow }) {
  const service = serviceById(request.task_type);
  const price = request.agreed_price === null ? null : Number(request.agreed_price);

  return (
    <article className="rounded-2xl border border-border bg-surface p-4 sm:p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <h2 className="font-display text-base font-semibold text-fg">
            {service?.name ?? request.task_type}
          </h2>
          <p className="mt-0.5 text-xs text-fg-faint">
            {request.service_category} · asked {new Date(request.created_at).toLocaleDateString()}
          </p>
        </div>
        <StatusPill status={request.status} />
      </div>

      {request.description ? (
        <p className="mt-3 text-sm whitespace-pre-wrap text-fg-muted">{request.description}</p>
      ) : null}

      <div className="mt-3 flex flex-wrap items-center gap-x-5 gap-y-2 text-sm">
        {price === null ? (
          <span className="flex items-center gap-1.5 text-fg-muted">
            <AlertTriangle className="h-3.5 w-3.5 shrink-0 text-orange-400" />
            No price yet — we&apos;ll come back with scope and a figure
          </span>
        ) : (
          <>
            <span className="text-fg-muted">
              Agreed <span className="font-semibold text-fg">{money(price)}</span>
            </span>
            {request.status === "awaiting_payment" ? (
              <span className="text-fg-muted">
                Deposit <span className="font-semibold text-fg">{money(upfrontDue(price))}</span>
              </span>
            ) : null}
          </>
        )}
      </div>

      {request.status === "awaiting_payment" && price !== null ? (
        <UsdtPanel agreedPrice={price} />
      ) : null}

      <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1.5">
        {service ? (
          <Link
            to={`/services/${service.id}`}
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-orange-400 hover:underline"
          >
            <FileText className="h-3.5 w-3.5" /> What this includes
          </Link>
        ) : null}
        {request.status === "confirmed" ? (
          <Link
            to="/projects"
            className="text-xs font-semibold text-orange-400 hover:underline"
          >
            Follow it in your projects →
          </Link>
        ) : null}
      </div>
    </article>
  );
}
