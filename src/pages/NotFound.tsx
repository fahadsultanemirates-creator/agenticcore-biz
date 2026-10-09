import { ArrowLeft } from "lucide-react";
import { useEffect } from "react";
import { Link } from "react-router-dom";
import { AuthCard, BUTTON } from "../components/auth/AuthCard";

/**
 * There was no catch-all route before this, so any address the router did not
 * recognise rendered an empty <Routes> -- a blank black page with no way out.
 * A mistyped URL should say so.
 */
export function NotFound() {
  useEffect(() => {
    document.title = "Page not found — AgenticCore.biz";
  }, []);

  return (
    <AuthCard>
      <h1 className="font-display text-2xl font-semibold text-fg">We can't find that page</h1>
      <p className="mt-1.5 text-sm text-fg-muted">
        The link may be out of date. Everything we offer is on the services page.
      </p>
      <div className="mt-6 flex flex-col gap-3">
        <Link to="/services" className={BUTTON}>
          Browse all 19 services
        </Link>
        <Link
          to="/"
          className="inline-flex items-center justify-center gap-2 rounded-full border-2 border-border px-5 py-3 text-sm font-semibold text-fg-muted transition-colors hover:border-orange-400/50 hover:text-fg"
        >
          <ArrowLeft className="h-4 w-4" /> Back home
        </Link>
      </div>
    </AuthCard>
  );
}
