import { Download, ExternalLink, FolderOpen } from "lucide-react";
import { useState } from "react";
import { Link } from "react-router-dom";
import { DashboardNav } from "../components/dashboard/DashboardNav";
import { DashboardShell } from "../components/dashboard/DashboardShell";
import { Panel } from "../components/dashboard/primitives";
import {
  formatBytes,
  signedDeliverableUrl,
  useDeliverables,
  useProjects,
  type DeliverableRow,
} from "../lib/dashboardData";

/**
 * Documents handed over, kept with the project they belong to.
 *
 * .biz is not .click or .agency, and this page has to say so. There, you
 * order a thing and download the thing. Here most of the work happens
 * inside the client's own systems -- their Drive folder, their Sheet,
 * their accounting software -- and the deliverable is often that their
 * books are current rather than a file. That access is recorded as a
 * project connection, not as a deliverable, which is why the empty state
 * points at projects instead of implying something is missing.
 *
 * What does belong here is the paperwork that bookkeeping, payroll and
 * compliance produce and a client is entitled to keep: a monthly
 * statement, a reconciliation, a filing, a payroll summary. Each one is
 * either a file in the private bucket or a link to where the thing
 * lives; the schema permits exactly one of the two.
 *
 * Files are fetched through a short-lived signed URL rather than a public
 * path. The bucket is private and must stay that way -- these are a
 * client's own financial records, and a guessable URL is not access
 * control.
 */
export function Files() {
  const deliverables = useDeliverables();
  const projects = useProjects();

  const nameFor = (id: string) =>
    projects.rows.find((project) => project.id === id)?.project_name ?? "Project";

  return (
    <DashboardShell title="Files & Deliverables">
      <DashboardNav />
      <section className="py-8">
        <h1 className="font-display text-2xl font-semibold text-fg sm:text-3xl">
          Files &amp; Deliverables
        </h1>
        <p className="mt-1.5 max-w-xl text-sm text-fg-muted">
          Statements, reconciliations, filings and summaries we have handed over — and where the
          rest of it lives.
        </p>

        <Panel
          loading={deliverables.loading || projects.loading}
          failed={deliverables.failed || projects.failed}
          reload={async () => {
            await Promise.all([deliverables.reload(), projects.reload()]);
          }}
          empty={deliverables.rows.length === 0}
          emptyIcon={FolderOpen}
          emptyText={
            <>
              Nothing filed here yet. Much of what we do happens inside your own systems rather
              than as a download, so check the access and progress on{" "}
              <Link to="/projects" className="font-semibold text-orange-400 hover:underline">
                your projects
              </Link>
              . Documents we hand over will appear here.
            </>
          }
        >
          <div className="mt-6 flex flex-col gap-3">
            {deliverables.rows.map((item) => (
              <DeliverableCard
                key={item.id}
                item={item}
                projectName={nameFor(item.project_id)}
              />
            ))}
          </div>
        </Panel>

        <p className="mt-6 text-xs text-fg-faint">
          Download links are generated when you click and expire after a few minutes, so a copied
          link will not keep working. Come back here for a fresh one.
        </p>
      </section>
    </DashboardShell>
  );
}

function DeliverableCard({ item, projectName }: { item: DeliverableRow; projectName: string }) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const download = async () => {
    if (!item.storage_path) return;
    setBusy(true);
    setError("");
    const url = await signedDeliverableUrl(item.storage_path);
    setBusy(false);
    if (!url) {
      setError("That link couldn't be generated. Please try again.");
      return;
    }
    window.open(url, "_blank", "noopener,noreferrer");
  };

  return (
    <article className="flex flex-wrap items-center gap-4 rounded-2xl border border-border bg-surface p-4 sm:p-5">
      <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-orange-400/10">
        {item.url ? (
          <ExternalLink className="h-5 w-5 text-orange-400" />
        ) : (
          <Download className="h-5 w-5 text-orange-400" />
        )}
      </span>

      <div className="min-w-0 flex-1">
        <h2 className="font-display text-base font-semibold text-fg">{item.label}</h2>
        <p className="mt-0.5 text-xs text-fg-faint">
          {projectName} · {new Date(item.created_at).toLocaleDateString()}
          {item.size_bytes ? ` · ${formatBytes(item.size_bytes)}` : ""}
        </p>
        {item.notes ? <p className="mt-2 text-sm text-fg-muted">{item.notes}</p> : null}
        {error ? <p className="mt-2 text-sm text-orange-300">{error}</p> : null}
      </div>

      {item.url ? (
        <a
          href={item.url}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex shrink-0 items-center gap-2 rounded-full border-2 border-border px-4 py-2.5 text-sm font-semibold text-fg transition-colors hover:border-orange-400/60"
        >
          Open <ExternalLink className="h-3.5 w-3.5" />
        </a>
      ) : (
        <button
          type="button"
          onClick={() => void download()}
          disabled={busy}
          className="inline-flex shrink-0 items-center gap-2 rounded-full bg-orange-400 px-4 py-2.5 text-sm font-semibold text-void transition-transform hover:-translate-y-0.5 disabled:opacity-60"
        >
          {busy ? "Preparing…" : "Download"}
          <Download className="h-3.5 w-3.5" />
        </button>
      )}
    </article>
  );
}
