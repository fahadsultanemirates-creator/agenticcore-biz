import { MessageSquare, Send } from "lucide-react";
import { useEffect, useMemo, useState, type FormEvent } from "react";
import { Link } from "react-router-dom";
import { DashboardNav } from "../components/dashboard/DashboardNav";
import { DashboardShell } from "../components/dashboard/DashboardShell";
import { Panel } from "../components/dashboard/primitives";
import {
  markRead,
  postMessage,
  useMessages,
  useProjects,
  type MessageRow,
} from "../lib/dashboardData";

/**
 * One thread per project.
 *
 * Before this there was no thread at all. A project had a status and
 * nothing else to say, so a client found out that work had moved by
 * noticing the status change, or by being told on Telegram -- outside the
 * product, unlogged, and invisible to anyone who came here to ask what
 * was happening.
 *
 * A client can post and can mark read. They cannot edit, and they cannot
 * post as us: the insert policy pins author to 'client', and
 * protect_message_content freezes body and author on update. A record
 * both sides rely on is one neither can quietly rewrite.
 */
export function Messages() {
  const messages = useMessages();
  const projects = useProjects();
  const [active, setActive] = useState<string | null>(null);

  const byProject = useMemo(() => {
    const map = new Map<string, MessageRow[]>();
    for (const message of messages.rows) {
      const list = map.get(message.project_id) ?? [];
      list.push(message);
      map.set(message.project_id, list);
    }
    return map;
  }, [messages.rows]);

  // Open on whichever project is actually waiting on the client, else the
  // one touched most recently -- useProjects orders by updated_at desc.
  useEffect(() => {
    if (active || projects.rows.length === 0) return;
    const withUnread = messages.rows.find(
      (message) => message.author !== "client" && message.read_at === null,
    );
    setActive(withUnread?.project_id ?? projects.rows[0].id);
  }, [active, projects.rows, messages.rows]);

  const thread = active ? (byProject.get(active) ?? []) : [];
  const unreadIds = thread
    .filter((message) => message.author !== "client" && message.read_at === null)
    .map((message) => message.id);

  // Mark the open thread read. Keyed on the ids rather than the array:
  // depending on the array itself would mark, reload, re-render and mark
  // again, forever.
  const unreadKey = unreadIds.join(",");
  useEffect(() => {
    if (unreadKey === "") return;
    void markRead(unreadKey.split(",")).then(() => messages.reload());
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [unreadKey]);

  return (
    <DashboardShell title="Messages">
      <DashboardNav />
      <section className="py-8">
        <h1 className="font-display text-2xl font-semibold text-fg sm:text-3xl">
          Messages &amp; Updates
        </h1>
        <p className="mt-1.5 text-sm text-fg-muted">
          Everything said about a project, kept with the project.
        </p>

        <Panel
          loading={messages.loading || projects.loading}
          failed={messages.failed || projects.failed}
          reload={async () => {
            await Promise.all([messages.reload(), projects.reload()]);
          }}
          empty={projects.rows.length === 0}
          emptyIcon={MessageSquare}
          emptyText={
            <>
              No projects yet, so there is nothing to discuss.{" "}
              <Link
                to="/create-project"
                className="font-semibold text-orange-400 hover:underline"
              >
                Scope one with us
              </Link>{" "}
              and this is where updates will appear.
            </>
          }
        >
          <div className="mt-6 grid gap-5 lg:grid-cols-[16rem_1fr]">
            <ul className="flex gap-2 overflow-x-auto lg:flex-col lg:overflow-visible">
              {projects.rows.map((project) => {
                const unread = (byProject.get(project.id) ?? []).filter(
                  (message) => message.author !== "client" && message.read_at === null,
                ).length;
                return (
                  <li key={project.id} className="shrink-0 lg:shrink">
                    <button
                      type="button"
                      onClick={() => setActive(project.id)}
                      aria-pressed={active === project.id}
                      className={`flex w-full items-center gap-2 rounded-xl border-2 px-3.5 py-2.5 text-left text-sm font-medium whitespace-nowrap transition-colors lg:whitespace-normal ${
                        active === project.id
                          ? "border-orange-400 bg-orange-400/5 text-fg"
                          : "border-border text-fg-muted hover:border-orange-400/50"
                      }`}
                    >
                      <span className="min-w-0 flex-1 truncate">{project.project_name}</span>
                      {unread > 0 ? (
                        <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-orange-400 px-1.5 text-[11px] font-bold text-void">
                          {unread}
                        </span>
                      ) : null}
                    </button>
                  </li>
                );
              })}
            </ul>

            {active ? (
              <Thread projectId={active} messages={thread} onSent={messages.reload} />
            ) : null}
          </div>
        </Panel>
      </section>
    </DashboardShell>
  );
}

function Thread({
  projectId,
  messages,
  onSent,
}: {
  projectId: string;
  messages: MessageRow[];
  onSent: () => Promise<void>;
}) {
  const [body, setBody] = useState("");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");

  const send = async (event: FormEvent) => {
    event.preventDefault();
    if (!body.trim()) return;
    setSending(true);
    const result = await postMessage(projectId, body);
    setSending(false);
    if ("error" in result) {
      setError(result.error);
      return;
    }
    setError("");
    setBody("");
    await onSent();
  };

  return (
    <div className="rounded-2xl border border-border bg-surface p-4 sm:p-5">
      {messages.length === 0 ? (
        <p className="py-6 text-center text-sm text-fg-faint">
          Nothing here yet. Ask anything about this project and it stays on the record.
        </p>
      ) : (
        <ol className="flex flex-col gap-3">
          {messages.map((message) => (
            <li
              key={message.id}
              className={`max-w-[85%] rounded-2xl px-4 py-2.5 ${
                message.author === "client"
                  ? "ml-auto bg-orange-400/10 text-fg"
                  : message.author === "system"
                    ? "mx-auto bg-transparent text-center text-xs text-fg-faint"
                    : "bg-surface-2 text-fg"
              }`}
            >
              {message.author !== "system" ? (
                <p className="mb-0.5 text-[11px] font-semibold tracking-wide text-fg-faint uppercase">
                  {message.author === "client" ? "You" : "AgenticCore"}
                </p>
              ) : null}
              <p className="text-sm whitespace-pre-wrap">{message.body}</p>
              <p className="mt-1 text-[11px] text-fg-faint">
                {new Date(message.created_at).toLocaleString()}
              </p>
            </li>
          ))}
        </ol>
      )}

      <form onSubmit={send} className="mt-5 flex flex-col gap-2 border-t border-border pt-4">
        <label htmlFor="message-body" className="sr-only">
          Your message
        </label>
        <textarea
          id="message-body"
          value={body}
          onChange={(event) => setBody(event.target.value)}
          rows={3}
          maxLength={5000}
          placeholder="Ask a question or add something we should know…"
          className="w-full rounded-xl border-2 border-border bg-void px-3.5 py-2.5 text-sm text-fg placeholder:text-fg-faint focus:border-orange-400 focus:outline-none"
        />
        {error ? <p className="text-sm text-orange-300">{error}</p> : null}
        <button
          type="submit"
          disabled={sending || !body.trim()}
          className="inline-flex self-start items-center gap-2 rounded-full bg-orange-400 px-5 py-2.5 text-sm font-semibold text-void transition-transform hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {sending ? "Sending…" : "Send"}
          <Send className="h-3.5 w-3.5" />
        </button>
      </form>
    </div>
  );
}
