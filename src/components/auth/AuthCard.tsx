import type { ReactNode } from "react";
import { Link } from "react-router-dom";
import { Logo } from "../Logo";

/**
 * The frame the three auth pages share, and the field styling with it.
 *
 * On .click these classes are pasted into each of Login, Signup and
 * ResetPassword, which is how its focus ring ended up yellow on two pages
 * and the third kept the old border colour for a while. Three pages is
 * exactly the number where a copy starts to rot, so the strings live here
 * and the pages import them.
 */
export const FIELD =
  "rounded-xl border-2 border-border bg-void px-3.5 py-2.5 text-fg placeholder:text-fg-faint focus:border-orange-400 focus:outline-none";

export const LABEL = "text-xs font-semibold tracking-wide text-fg-muted uppercase";

export const BUTTON =
  "mt-2 inline-flex items-center justify-center gap-2 rounded-full bg-orange-400 px-5 py-3 text-sm font-semibold text-void shadow-glow-orange transition-transform hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-60";

export const LINK = "font-semibold text-orange-400 hover:underline";

/** Error text. Orange on near-black reads as the brand, not as danger, so
 *  the copy has to carry the weight -- which it does: these are all
 *  actionable messages, not failures. */
export const ERROR = "text-sm text-orange-300";

export function AuthCard({ children, footer }: { children: ReactNode; footer?: ReactNode }) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-void px-6 py-16">
      <div className="w-full max-w-sm">
        <Link to="/" className="mb-8 flex justify-center" aria-label="AgenticCore.biz home">
          <Logo />
        </Link>

        <div className="rounded-2xl border border-border bg-surface p-7">{children}</div>

        {footer ? <p className="mt-6 text-center text-sm text-fg-muted">{footer}</p> : null}
      </div>
    </div>
  );
}
