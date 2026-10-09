import { useEffect, type ReactNode } from "react";
import { useLocation } from "react-router-dom";
import { DashboardHeader } from "./DashboardHeader";

type Props = {
  /** Page name — shown in the header crumb and used as the browser tab title. */
  title: string;
  children: ReactNode;
  /** Where the back button goes. Defaults to the dashboard (or home, on the dashboard itself). */
  backTo?: string;
  backLabel?: string;
};

/**
 * One shared frame for the dashboard and everything under it, matching
 * .click: a slim sticky header, and the page scrolling normally underneath.
 *
 * No left rail. The old static dashboard pinned a service rail down the side
 * of every page, which ate most of a phone screen before any content was
 * drawn. Navigation lives in the dashboard's own grid instead.
 *
 * The bottom padding clears the floating Forge button, so the last row of any
 * list is still reachable.
 */
export function DashboardShell({ title, children, backTo, backLabel }: Props) {
  const { pathname } = useLocation();
  const isRoot = pathname === "/dashboard";

  // On the dashboard itself, "back" means out to the public site.
  const resolvedBackTo = backTo ?? (isRoot ? "/" : "/dashboard");
  const resolvedBackLabel = backLabel ?? (isRoot ? "Home" : "Dashboard");

  useEffect(() => {
    document.title = isRoot ? "Dashboard — AgenticCore.biz" : `${title} — AgenticCore.biz`;
  }, [title, isRoot]);

  return (
    <div className="min-h-screen bg-void">
      <DashboardHeader
        crumb={isRoot ? null : title}
        backTo={resolvedBackTo}
        backLabel={resolvedBackLabel}
      />
      <main className="mx-auto w-full max-w-6xl px-4 pb-28 sm:px-6">{children}</main>
    </div>
  );
}
