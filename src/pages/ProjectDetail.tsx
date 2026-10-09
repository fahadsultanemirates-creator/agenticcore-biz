import { Check, ExternalLink, Link2, Plus, ShieldCheck, Trash2, X } from "lucide-react";
import { useMemo, useState, type FormEvent } from "react";
import { useParams } from "react-router-dom";
import { ChatLauncher } from "../components/ChatLauncher";
import { DashboardShell } from "../components/dashboard/DashboardShell";
import { Panel, StatusPill } from "../components/dashboard/primitives";
import {
  connectionGroups,
  connectionStatusLabels,
  providerById,
  providersIn,
  type ConnectionProvider,
} from "../data/connections";
import {
  addConnection,
  removeConnection,
  setConnectionStatus,
  useConnections,
  useProjects,
  type ConnectionRow,
} from "../lib/dashboardData";
import { NotFound } from "./NotFound";

/**
 * One project, and the systems we work inside to run it.
 *
 * .click's project page is a shelf of delivered files with download buttons.
 * There is nothing to download here, and pretending otherwise would be the
 * wrong page: a bookkeeping engagement produces a reconciled ledger in the
 * client's own accounting software, not a zip file. So the body of this page
 * is the connection list -- where we have access, where we are still waiting
 * for it, and what to do about the ones that are waiting.
 */
export function ProjectDetail() {
  const { id } = useParams<{ id: string }>();
  const projects = useProjects();
  const connections = useConnections();
  const [adding, setAdding] = useState<ConnectionProvider | null>(null);

  const project = projects.rows.find((row) => row.id === id);

  // Three different reasons this page might have no project, and they are
  // not interchangeable. Getting this wrong is how the first version of
  // this page sat on "Loading…" forever whenever the query failed: the
  // not-found check excluded `failed`, so a failed load fell through to a
  // render with no project and no way to retry.
  if (projects.loading) {
    return (
      <DashboardShell title="Project" backTo="/projects" backLabel="Projects">
        <p className="mt-8 rounded-2xl border border-dashed border-border bg-surface p-6 text-sm text-fg-faint">
          Loading…
        </p>
      </DashboardShell>
    );
  }

  if (projects.failed) {
    return (
      <DashboardShell title="Project" backTo="/projects" backLabel="Projects">
        <div className="mt-8 rounded-2xl border border-dashed border-border bg-surface p-6">
          <p className="text-sm text-fg-muted">We couldn't load this project just now.</p>
          <button
            type="button"
            onClick={() => void projects.reload()}
            className="mt-3 text-sm font-semibold text-orange-400 hover:underline"
          >
            Try again
          </button>
        </div>
      </DashboardShell>
    );
  }

  // Loaded, and it genuinely is not one of theirs.
  if (!project) return <NotFound />;

  const mine = connections.rows.filter((row) => row.project_id === id);
  const pending = mine.filter((row) => row.status === "requested");

  return (
    <DashboardShell
      title={project.project_name}
      backTo="/projects"
      backLabel="Projects"
    >
      <section className="py-8">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0">
            <h1 className="font-display text-2xl font-semibold text-fg sm:text-3xl">
              {project.project_name}
            </h1>
            <p className="mt-1.5 text-sm text-fg-muted">
              Opened {new Date(project.created_at).toLocaleDateString()} · last updated{" "}
              {new Date(project.updated_at).toLocaleDateString()}
            </p>
          </div>
          <StatusPill status={project.status} />
        </div>

        <div className="mt-8 border-t border-border pt-8">
          <h2 className="flex items-center gap-2 font-display text-xl font-semibold text-fg">
            <Link2 className="h-5 w-5 text-orange-400" /> Connected systems
          </h2>
          <p className="mt-1.5 max-w-2xl text-sm text-fg-muted">
            This is where the work happens. Give us access to the places your paperwork and numbers
            already live, and we work inside them — so you keep owning everything, and nothing has
            to be handed back at the end.
          </p>

          <div className="mt-4 flex items-start gap-2 rounded-xl border border-border bg-surface px-3 py-3 text-xs text-fg-muted">
            <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-orange-400" />
            <span>
              We never ask for a password or store any login. Everything below is a folder you've
              shared or a user invite you've sent, and you can withdraw any of it at any time from
              the service itself.
            </span>
          </div>

          {pending.length > 0 ? (
            <p className="mt-4 rounded-xl border border-orange-400/40 bg-orange-400/10 px-3 py-2.5 text-sm font-semibold text-orange-400">
              {pending.length === 1
                ? "1 system is waiting on access from you."
                : `${pending.length} systems are waiting on access from you.`}
            </p>
          ) : null}

          <Panel
            loading={connections.loading}
            failed={connections.failed}
            reload={connections.reload}
            empty={mine.length === 0}
            emptyIcon={Link2}
            emptyText="Nothing connected yet. Add the first system below and we'll take it from there."
          >
            <div className="mt-5 flex flex-col gap-3">
              {mine.map((row) => (
                <ConnectionCard key={row.id} row={row} onChanged={connections.reload} />
              ))}
            </div>
          </Panel>

          <AddConnection
            projectId={id ?? ""}
            selected={adding}
            onSelect={setAdding}
            onAdded={async () => {
              setAdding(null);
              await connections.reload();
            }}
          />
        </div>
      </section>
      <ChatLauncher />
    </DashboardShell>
  );
}

function ConnectionCard({ row, onChanged }: { row: ConnectionRow; onChanged: () => Promise<void> }) {
  const provider = providerById(row.provider);
  const [busy, setBusy] = useState(false);
  const Icon = provider?.icon ?? Link2;

  // A link is only worth rendering as a link if it is one. A QuickBooks
  // "location" is a company name, and turning that into an href produces a
  // dead link that looks clickable.
  const href = /^https?:\/\//i.test(row.location ?? "") ? row.location : null;

  const act = async (fn: () => Promise<unknown>) => {
    setBusy(true);
    await fn();
    await onChanged();
    setBusy(false);
  };

  return (
    <article className="rounded-2xl border border-border bg-surface p-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex min-w-0 items-start gap-3">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-orange-400/10">
            <Icon className="h-5 w-5 text-orange-400" strokeWidth={2.25} />
          </span>
          <div className="min-w-0">
            <p className="font-display text-base font-semibold text-fg">{row.label}</p>
            <p className="text-xs text-fg-faint">{provider?.name ?? row.provider}</p>
          </div>
        </div>
        <span
          className={`shrink-0 rounded-full px-2.5 py-1 text-[11px] font-bold tracking-wide uppercase ${
            row.status === "connected"
              ? "bg-surface-2 text-fg-muted"
              : row.status === "requested"
                ? "bg-orange-400 text-void"
                : "bg-surface-2 text-fg-faint line-through"
          }`}
        >
          {connectionStatusLabels[row.status]}
        </span>
      </div>

      {row.location ? (
        href ? (
          <a
            href={href}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-3 inline-flex max-w-full items-center gap-1.5 truncate text-xs text-orange-400 hover:underline"
          >
            <ExternalLink className="h-3 w-3 shrink-0" />
            <span className="truncate">{row.location}</span>
          </a>
        ) : (
          <p className="mt-3 truncate font-mono text-xs text-fg-muted">{row.location}</p>
        )
      ) : null}

      {row.notes ? (
        <p className="mt-2 text-sm whitespace-pre-wrap text-fg-muted">{row.notes}</p>
      ) : null}

      {row.status === "requested" && provider ? (
        <p className="mt-3 rounded-xl border border-border bg-void px-3 py-2.5 text-xs text-fg-muted">
          {provider.howTo}
        </p>
      ) : null}

      <div className="mt-3 flex flex-wrap items-center gap-3 text-xs font-semibold">
        {row.status === "requested" ? (
          <button
            type="button"
            disabled={busy}
            onClick={() => void act(() => setConnectionStatus(row.id, "connected"))}
            className="inline-flex items-center gap-1.5 text-orange-400 hover:underline disabled:opacity-50"
          >
            <Check className="h-3.5 w-3.5" /> I've shared it
          </button>
        ) : null}
        {row.status === "connected" ? (
          <button
            type="button"
            disabled={busy}
            onClick={() => void act(() => setConnectionStatus(row.id, "revoked"))}
            className="inline-flex items-center gap-1.5 text-fg-muted hover:text-fg hover:underline disabled:opacity-50"
          >
            <X className="h-3.5 w-3.5" /> End access
          </button>
        ) : null}
        <button
          type="button"
          disabled={busy}
          onClick={() => void act(() => removeConnection(row.id))}
          className="inline-flex items-center gap-1.5 text-fg-faint hover:text-fg-muted hover:underline disabled:opacity-50"
        >
          <Trash2 className="h-3.5 w-3.5" /> Remove
        </button>
      </div>
    </article>
  );
}

function AddConnection({
  projectId,
  selected,
  onSelect,
  onAdded,
}: {
  projectId: string;
  selected: ConnectionProvider | null;
  onSelect: (provider: ConnectionProvider | null) => void;
  onAdded: () => Promise<void>;
}) {
  const [label, setLabel] = useState("");
  const [location, setLocation] = useState("");
  const [notes, setNotes] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const groups = useMemo(
    () => connectionGroups.map((group) => ({ group, providers: providersIn(group.id) })),
    [],
  );

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    if (!selected) return;
    if (!label.trim()) {
      setError("Give it a name you'll recognise — “2025 receipts” is plenty.");
      return;
    }
    setError("");
    setBusy(true);
    const result = await addConnection({
      projectId,
      provider: selected.id,
      label,
      location,
      notes,
    });
    setBusy(false);
    if ("error" in result) {
      setError(result.error);
      return;
    }
    setLabel("");
    setLocation("");
    setNotes("");
    await onAdded();
  };

  if (selected) {
    return (
      <form onSubmit={submit} className="mt-6 rounded-2xl border border-border bg-surface p-5">
        <div className="flex items-start gap-3">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-orange-400/10">
            <selected.icon className="h-5 w-5 text-orange-400" strokeWidth={2.25} />
          </span>
          <div className="min-w-0">
            <p className="font-display text-base font-semibold text-fg">{selected.name}</p>
            <p className="mt-0.5 text-xs text-fg-muted">{selected.purpose}</p>
          </div>
          <button
            type="button"
            onClick={() => onSelect(null)}
            aria-label="Choose a different system"
            className="ml-auto shrink-0 text-fg-faint transition-colors hover:text-fg"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <p className="mt-4 rounded-xl border border-orange-400/30 bg-orange-400/5 px-3 py-2.5 text-sm text-fg-muted">
          {selected.howTo}
        </p>

        <div className="mt-4 flex flex-col gap-4">
          <label className="flex flex-col gap-1.5">
            <span className="text-xs font-semibold tracking-wide text-fg-muted uppercase">
              What is it
            </span>
            <input
              value={label}
              onChange={(e) => setLabel(e.target.value)}
              maxLength={120}
              autoFocus
              placeholder="2025 receipts"
              className="rounded-xl border-2 border-border bg-void px-3.5 py-2.5 text-fg placeholder:text-fg-faint focus:border-orange-400 focus:outline-none"
            />
          </label>

          <label className="flex flex-col gap-1.5">
            <span className="text-xs font-semibold tracking-wide text-fg-muted uppercase">
              {selected.locationLabel}
            </span>
            <input
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              maxLength={2048}
              placeholder={selected.locationHint}
              className="rounded-xl border-2 border-border bg-void px-3.5 py-2.5 text-fg placeholder:text-fg-faint focus:border-orange-400 focus:outline-none"
            />
          </label>

          <label className="flex flex-col gap-1.5">
            <span className="text-xs font-semibold tracking-wide text-fg-muted uppercase">
              Anything we should know
            </span>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              maxLength={2000}
              rows={3}
              placeholder="Optional — which email you shared it with, what's in there, anything to avoid."
              className="rounded-xl border-2 border-border bg-void px-3.5 py-2.5 text-fg placeholder:text-fg-faint focus:border-orange-400 focus:outline-none"
            />
          </label>
        </div>

        {error ? <p className="mt-3 text-sm text-orange-300">{error}</p> : null}

        <button
          type="submit"
          disabled={busy}
          className="mt-4 inline-flex items-center gap-2 rounded-full bg-orange-400 px-5 py-2.5 text-sm font-semibold text-void shadow-glow-orange transition-transform hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {busy ? "Saving…" : "Add system"}
        </button>
      </form>
    );
  }

  return (
    <div className="mt-8 border-t border-border pt-6">
      <h3 className="flex items-center gap-2 font-display text-base font-semibold text-fg">
        <Plus className="h-4 w-4 text-orange-400" /> Add a system
      </h3>
      <p className="mt-1 text-sm text-fg-muted">
        Pick where the work needs to happen. You can add more later.
      </p>

      <div className="mt-5 flex flex-col gap-6">
        {groups.map(({ group, providers }) => (
          <div key={group.id}>
            <div className="mb-2 flex items-center gap-2">
              <group.icon className="h-4 w-4 shrink-0 text-orange-400" strokeWidth={2.25} />
              <p className="font-display text-sm font-semibold text-fg">{group.label}</p>
            </div>
            <p className="mb-3 text-xs text-fg-faint">{group.blurb}</p>
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3">
              {providers.map((provider) => (
                <button
                  key={provider.id}
                  type="button"
                  onClick={() => onSelect(provider)}
                  className="group flex items-start gap-2.5 rounded-xl border border-border bg-surface p-3 text-left transition-colors hover:border-orange-400/50 hover:bg-surface-2"
                >
                  <provider.icon
                    className="mt-0.5 h-4 w-4 shrink-0 text-orange-400"
                    strokeWidth={2.25}
                  />
                  <span className="min-w-0">
                    <span className="block text-sm font-semibold text-fg">{provider.name}</span>
                    <span className="mt-0.5 block text-xs leading-relaxed text-fg-muted">
                      {provider.purpose}
                    </span>
                  </span>
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
