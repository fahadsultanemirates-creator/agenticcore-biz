import { FolderKanban, Link2 } from "lucide-react";
import { Link } from "react-router-dom";
import { ChatLauncher } from "../components/ChatLauncher";
import { DashboardShell } from "../components/dashboard/DashboardShell";
import { Panel, StatusPill } from "../components/dashboard/primitives";
import { useConnections, useProjects, type ProjectRow } from "../lib/dashboardData";

/**
 * The work we are running for this client.
 *
 * A client cannot create a project here, and the page does not pretend they
 * can: `projects` has a select-own policy and no insert policy, because a
 * project is opened by us from a confirmed request. That is the .biz model --
 * discuss, agree, then start -- so the empty state points at the request
 * flow rather than offering a "New project" button that would fail.
 */
export function Projects() {
  const projects = useProjects();
  const connections = useConnections();

  const countFor = (projectId: string) =>
    connections.rows.filter((row) => row.project_id === projectId && row.status !== "revoked")
      .length;

  return (
    <DashboardShell title="Projects" backTo="/dashboard" backLabel="Dashboard">
      <section className="py-8">
        <h1 className="font-display text-2xl font-semibold text-fg sm:text-3xl">Your projects</h1>
        <p className="mt-1.5 text-sm text-fg-muted">
          Everything we're running for you, and the systems we work in to do it.
        </p>

        <Panel
          loading={projects.loading}
          failed={projects.failed}
          reload={projects.reload}
          empty={projects.rows.length === 0}
          emptyIcon={FolderKanban}
          emptyText="No projects yet. Once we've agreed scope on a request, it opens as a project here."
        >
          <div className="mt-6 grid gap-3 sm:grid-cols-2 sm:gap-4 lg:grid-cols-3">
            {projects.rows.map((project) => (
              <ProjectCard
                key={project.id}
                project={project}
                connectionCount={countFor(project.id)}
              />
            ))}
          </div>
        </Panel>

        {projects.rows.length === 0 && !projects.loading && !projects.failed ? (
          <div className="mt-4 text-center">
            <Link
              to="/dashboard#services"
              className="inline-flex items-center gap-2 rounded-full bg-orange-400 px-5 py-2.5 text-sm font-semibold text-void shadow-glow-orange transition-transform hover:-translate-y-0.5"
            >
              Pick a service
            </Link>
          </div>
        ) : null}
      </section>
      <ChatLauncher />
    </DashboardShell>
  );
}

function ProjectCard({
  project,
  connectionCount,
}: {
  project: ProjectRow;
  connectionCount: number;
}) {
  return (
    <Link
      to={`/projects/${project.id}`}
      className="flex flex-col gap-3 rounded-2xl border border-border bg-surface p-4 transition-colors hover:border-orange-400/50 sm:p-5"
    >
      <div className="flex items-start justify-between gap-3">
        <p className="min-w-0 font-display text-base font-semibold text-fg">
          {project.project_name}
        </p>
        <StatusPill status={project.status} />
      </div>

      <p className="flex items-center gap-1.5 text-xs text-fg-muted">
        <Link2 className="h-3.5 w-3.5 shrink-0 text-orange-400" />
        {connectionCount === 0
          ? "No systems connected yet"
          : `${connectionCount} ${connectionCount === 1 ? "system" : "systems"} connected`}
      </p>

      <p className="mt-auto text-xs text-fg-faint">
        Updated {new Date(project.updated_at).toLocaleDateString()}
        {project.revisions_used > 0
          ? ` · ${project.revisions_used} revision${project.revisions_used === 1 ? "" : "s"} used`
          : ""}
      </p>
    </Link>
  );
}
