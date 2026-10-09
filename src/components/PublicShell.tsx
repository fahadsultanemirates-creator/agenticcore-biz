import { type ReactNode, useEffect } from "react";
import { ArrowLeft } from "lucide-react";
import { Link } from "react-router-dom";
import { ChatLauncher } from "./ChatLauncher";
import { Logo } from "./Logo";
import { Footer } from "./landing/Footer";

/** The frame for every public page that is not the landing page. */
export function PublicShell({
  title,
  backTo = "/",
  backLabel = "Home",
  children,
}: {
  title: string;
  backTo?: string;
  backLabel?: string;
  children: ReactNode;
}) {
  useEffect(() => {
    document.title = `${title} — AgenticCore.biz`;
  }, [title]);

  return (
    <div className="min-h-dvh bg-void">
      <header className="sticky top-0 z-40 border-b border-border bg-void/90 backdrop-blur">
        <div className="mx-auto flex w-full max-w-6xl items-center gap-2 px-4 py-3 sm:gap-3 sm:px-6">
          <Link
            to={backTo}
            aria-label={`Back to ${backLabel}`}
            className="flex h-9 shrink-0 items-center gap-1.5 rounded-full border border-border px-2.5 text-sm font-semibold text-fg-muted transition-colors hover:border-orange-400/50 hover:text-fg sm:px-3.5"
          >
            <ArrowLeft className="h-4 w-4" />
            <span className="hidden sm:inline">{backLabel}</span>
          </Link>
          <Link to="/" aria-label="AgenticCore Biz home" className="min-w-0 shrink-0">
            <Logo compact className="sm:hidden" />
            <Logo className="hidden sm:block" />
          </Link>
          <div className="ml-auto flex shrink-0 items-center gap-2">
            <a
              href="/login.html"
              className="hidden rounded-full border border-border px-4 py-2 text-sm font-semibold text-fg-muted transition-colors hover:border-orange-400/50 hover:text-fg sm:inline-flex"
            >
              Sign In
            </a>
            <a
              href="/signup.html"
              className="rounded-full bg-orange-400 px-4 py-2 text-sm font-semibold text-void transition-transform hover:-translate-y-0.5"
            >
              Get Started Free
            </a>
          </div>
        </div>
      </header>
      <main className="mx-auto w-full max-w-6xl px-4 pb-28 sm:px-6">{children}</main>
      <Footer />
      <ChatLauncher />
    </div>
  );
}
