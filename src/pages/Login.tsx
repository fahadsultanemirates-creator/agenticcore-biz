import { ArrowRight } from "lucide-react";
import { useState, type FormEvent } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { AuthCard, BUTTON, ERROR, FIELD, LABEL, LINK } from "../components/auth/AuthCard";
import { PasswordInput } from "../components/PasswordInput";
import { useAuth } from "../context/AuthContext";

export function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  // Where RequireAuth sent them from, so signing in returns them to the page
  // they actually wanted rather than always to the dashboard.
  const from = (location.state as { from?: string } | null)?.from ?? "/dashboard";

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !password.trim()) {
      setError("Enter an email and password to continue.");
      return;
    }
    setError("");
    setSubmitting(true);
    const { error: loginError } = await login(email.trim(), password);
    setSubmitting(false);
    if (loginError) {
      setError(loginError);
      return;
    }
    navigate(from, { replace: true });
  };

  return (
    <AuthCard
      footer={
        <>
          New here?{" "}
          <Link to="/signup" className={LINK}>
            Create an account
          </Link>
        </>
      }
    >
      <h1 className="font-display text-2xl font-semibold text-fg">Welcome back</h1>
      <p className="mt-1.5 text-sm text-fg-muted">Sign in to your dashboard.</p>

      <form onSubmit={handleSubmit} className="mt-6 flex flex-col gap-4">
        <label className="flex flex-col gap-1.5">
          <span className={LABEL}>Email</span>
          <input
            type="email"
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@business.com"
            className={FIELD}
          />
        </label>

        <label className="flex flex-col gap-1.5">
          <div className="flex items-baseline justify-between gap-3">
            <span className={LABEL}>Password</span>
            <Link to="/reset" className="text-xs font-semibold text-orange-400 hover:underline">
              Forgot?
            </Link>
          </div>
          <PasswordInput
            autoComplete="current-password"
            value={password}
            onChange={setPassword}
            placeholder="••••••••"
            className={FIELD}
          />
        </label>

        {error && <p className={ERROR}>{error}</p>}

        <button type="submit" disabled={submitting} className={BUTTON}>
          {submitting ? "Signing in…" : "Sign in"}
          <ArrowRight className="h-4 w-4" />
        </button>
      </form>
    </AuthCard>
  );
}
