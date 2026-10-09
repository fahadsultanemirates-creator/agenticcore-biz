import { FolderKanban, LayoutGrid, LogIn, LogOut, UserRound, type LucideIcon } from "lucide-react";
import { useEffect, useRef, useState, type ReactNode } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

/**
 * The one account control, used by both the public nav and the dashboard
 * header, so "am I signed in" is answered the same way everywhere.
 *
 * .click's version carries a wallet balance. There is no wallet here and no
 * wallets table: .biz bills per engagement after a conversation, so the
 * menu is identity and navigation only.
 */
export function AccountMenu() {
  const { user } = useAuth();
  return user ? <SignedInMenu /> : <SignedOutActions />;
}

function SignedOutActions() {
  return (
    <div className="flex shrink-0 items-center gap-2">
      {/* Label collapses to the icon on a phone so the header never gets
          crowded next to the menu button. */}
      <Link
        to="/login"
        aria-label="Sign in"
        className="flex h-9 items-center gap-1.5 rounded-full border border-border px-2.5 text-sm font-semibold text-fg-muted transition-colors hover:border-orange-400/50 hover:text-fg sm:px-4"
      >
        <LogIn className="h-4 w-4" />
        <span className="hidden sm:inline">Sign in</span>
      </Link>
      <Link
        to="/signup"
        className="flex h-9 items-center rounded-full bg-orange-400 px-3.5 text-sm font-semibold text-void shadow-glow-orange transition-transform hover:-translate-y-0.5 active:translate-y-0 sm:px-5"
      >
        Get started
      </Link>
    </div>
  );
}

function SignedInMenu() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onPointerDown = (event: MouseEvent | TouchEvent) => {
      if (!containerRef.current?.contains(event.target as Node)) setOpen(false);
    };
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", onPointerDown);
    document.addEventListener("touchstart", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("mousedown", onPointerDown);
      document.removeEventListener("touchstart", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  const handleLogout = async () => {
    await logout();
    setOpen(false);
    navigate("/", { replace: true });
  };

  const initial = user?.name?.trim()?.[0]?.toUpperCase() ?? "Y";

  return (
    <div className="relative flex shrink-0 items-center gap-2" ref={containerRef}>
      <button
        type="button"
        onClick={() => setOpen(!open)}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label="Account menu"
        className="flex h-9 w-9 items-center justify-center rounded-full bg-orange-400 text-sm font-semibold text-void transition-transform hover:-translate-y-0.5"
      >
        {initial}
      </button>

      {open && (
        <div
          role="menu"
          className="absolute top-full right-0 z-50 mt-2 w-60 overflow-hidden rounded-2xl border border-border bg-surface shadow-glow"
        >
          <div className="flex items-center gap-2.5 border-b border-border px-4 py-3">
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-orange-400/10">
              <UserRound className="h-4 w-4 text-orange-400" />
            </span>
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold text-fg">{user?.name}</p>
              {/* The business name when there is one, the email when there
                  isn't -- two lines of the same thing is wasted space. */}
              <p className="truncate text-xs text-fg-faint">{user?.company || user?.email}</p>
            </div>
          </div>

          <nav className="flex flex-col p-1.5">
            <MenuLink to="/dashboard" icon={LayoutGrid} onClick={() => setOpen(false)}>
              Dashboard
            </MenuLink>
            <MenuLink to="/projects" icon={FolderKanban} onClick={() => setOpen(false)}>
              Your projects
            </MenuLink>
            <button
              type="button"
              role="menuitem"
              onClick={handleLogout}
              className="flex items-center gap-2.5 rounded-xl px-3 py-2.5 text-left text-sm font-medium text-fg-muted transition-colors hover:bg-surface-2 hover:text-fg"
            >
              <LogOut className="h-4 w-4" /> Sign out
            </button>
          </nav>
        </div>
      )}
    </div>
  );
}

function MenuLink({
  to,
  icon: Icon,
  onClick,
  children,
}: {
  to: string;
  icon: LucideIcon;
  onClick: () => void;
  children: ReactNode;
}) {
  return (
    <Link
      to={to}
      role="menuitem"
      onClick={onClick}
      className="flex items-center gap-2.5 rounded-xl px-3 py-2.5 text-sm font-medium text-fg-muted transition-colors hover:bg-surface-2 hover:text-fg"
    >
      <Icon className="h-4 w-4" /> {children}
    </Link>
  );
}
