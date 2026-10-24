import {
  FileText,
  FolderKanban,
  FolderOpen,
  LayoutGrid,
  type LucideIcon,
  MessageSquare,
  Package,
  Receipt,
  Settings,
  ShoppingBag,
  Sparkles,
} from "lucide-react";
import { NavLink } from "react-router-dom";

/**
 * The ten areas, as one strip under the header.
 *
 * Not a left rail. The old static dashboard pinned one down the side of
 * every page and it ate most of a phone screen before any content drew,
 * which is why DashboardShell has none. But ten destinations still have
 * to be reachable from each other, and before this they were not: four
 * of them had no route at all, and the rest were reachable only by
 * guessing a URL or scrolling the dashboard to find an anchor.
 *
 * The layout is the one .agency arrived at the hard way. There the strip
 * was a single non-wrapping row inside a max-w-6xl column, so its
 * container was 1152px however wide the display, while ten items came to
 * ~1430px. It overflowed by roughly 330px at 1280px AND at 1920px, which
 * left the last two areas permanently behind a sideways scrollbar --
 * unreachable unless you knew to drag. So it wraps as soon as there is
 * more than one row's worth of room, and only scrolls sideways on a
 * phone, where wrapping ten items would push the page content off screen
 * instead.
 *
 * Three of these are public pages -- services, packages and Maya. They
 * are listed because a client looking for "where do I start something"
 * should find it here rather than leaving the dashboard and coming back,
 * and they work signed out anyway.
 */
type Area = { to: string; label: string; icon: LucideIcon; end?: boolean; badge?: number };

export function DashboardNav({ unreadMessages = 0 }: { unreadMessages?: number }) {
  const AREAS: Area[] = [
    { to: "/dashboard", label: "Overview", icon: LayoutGrid, end: true },
    { to: "/services", label: "Browse Services", icon: ShoppingBag },
    { to: "/packages", label: "Packages", icon: Package },
    { to: "/projects", label: "My Projects", icon: FolderKanban },
    { to: "/maya", label: "Talk to Maya", icon: Sparkles },
    { to: "/orders", label: "Orders", icon: FileText },
    { to: "/messages", label: "Messages", icon: MessageSquare, badge: unreadMessages },
    { to: "/invoices", label: "Invoices & Payments", icon: Receipt },
    { to: "/files", label: "Files & Deliverables", icon: FolderOpen },
    { to: "/account", label: "Account Settings", icon: Settings },
  ];

  return (
    <nav
      aria-label="Dashboard sections"
      // -mx-4 plus px-4 lets the strip bleed to the screen edge on a
      // phone, so the last item does not look clipped mid-word. Above sm
      // it stops scrolling and wraps instead, so nothing is hidden.
      className="-mx-4 mb-2 overflow-x-auto border-b border-border px-4 sm:-mx-6 sm:overflow-x-visible sm:px-6"
    >
      <ul className="flex min-w-max items-center gap-1 py-2 sm:min-w-0 sm:flex-wrap">
        {AREAS.map((area) => (
          <li key={area.to}>
            <NavLink
              to={area.to}
              end={area.end}
              className={({ isActive }) =>
                `flex items-center gap-1.5 rounded-full px-3 py-2 text-sm font-medium whitespace-nowrap transition-colors ${
                  isActive
                    ? "bg-orange-400/10 text-orange-400"
                    : "text-fg-muted hover:bg-surface hover:text-fg"
                }`
              }
            >
              <area.icon className="h-4 w-4 shrink-0" />
              {area.label}
              {area.badge ? (
                <span className="ml-0.5 flex h-5 min-w-5 items-center justify-center rounded-full bg-orange-400 px-1.5 text-[11px] font-bold text-void">
                  {area.badge}
                </span>
              ) : null}
            </NavLink>
          </li>
        ))}
      </ul>
    </nav>
  );
}
