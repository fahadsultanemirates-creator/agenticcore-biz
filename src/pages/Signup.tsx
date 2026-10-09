import { ArrowRight, Gift, MailCheck } from "lucide-react";
import { useState, type FormEvent } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { AuthCard, BUTTON, ERROR, FIELD, LABEL, LINK } from "../components/auth/AuthCard";
import { PasswordInput } from "../components/PasswordInput";
import { useAuth } from "../context/AuthContext";

// Eight, not six. The old signup page enforced eight and told people so, and
// the only thing worse than an arbitrary minimum is one that moves.
const MIN_PASSWORD = 8;

export function Signup() {
  const { signup } = useAuth();
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const [name, setName] = useState("");
  const [company, setCompany] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [awaitingConfirmation, setAwaitingConfirmation] = useState(false);

  // Referral links are /signup?ref=CODE, and handle_new_user turns that code
  // into profiles.referred_by. The old page read it from the query string, so
  // every referral link already in circulation carries it -- dropping it here
  // would break those links quietly, which is the only way this feature can
  // fail without anybody noticing.
  const referralCode = params.get("ref");

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !password.trim()) {
      setError("Enter an email and password to continue.");
      return;
    }
    if (password.length < MIN_PASSWORD) {
      setError(`Password must be at least ${MIN_PASSWORD} characters.`);
      return;
    }
    setError("");
    setSubmitting(true);
    const { error: signupError, needsConfirmation } = await signup({
      name,
      company,
      email: email.trim(),
      password,
      referralCode,
    });
    setSubmitting(false);
    if (signupError) {
      setError(signupError);
      return;
    }
    // With email confirmation on there is no session yet, so navigating to
    // the dashboard would bounce them straight back to /login.
    if (needsConfirmation) {
      setAwaitingConfirmation(true);
      return;
    }
    navigate("/dashboard", { replace: true });
  };

  return (
    <AuthCard
      footer={
        <>
          Already have an account?{" "}
          <Link to="/login" className={LINK}>
            Sign in
          </Link>
        </>
      }
    >
      {awaitingConfirmation ? (
        <>
          <MailCheck className="h-8 w-8 text-orange-400" />
          <h1 className="mt-3 font-display text-2xl font-semibold text-fg">Confirm your email</h1>
          <p className="mt-1.5 text-sm text-fg-muted">
            We've sent a link to {email.trim()}. Click it and your dashboard is ready — the account
            is already created, it just needs confirming.
          </p>
          <p className="mt-4 text-sm text-fg-faint">Nothing after a few minutes? Check spam.</p>
        </>
      ) : (
        <>
          <h1 className="font-display text-2xl font-semibold text-fg">Create your account</h1>
          <p className="mt-1.5 text-sm text-fg-muted">
            One place for your projects, your documents and everything we run for you.
          </p>

          {referralCode ? (
            <p className="mt-4 flex items-start gap-2 rounded-xl border border-orange-400/30 bg-orange-400/5 p-3 text-sm text-fg-muted">
              <Gift className="mt-0.5 h-4 w-4 shrink-0 text-orange-400" />
              <span>
                You were referred with code{" "}
                <span className="font-semibold text-fg">{referralCode}</span>. It's applied to this
                account when you sign up.
              </span>
            </p>
          ) : null}

          <form onSubmit={handleSubmit} className="mt-6 flex flex-col gap-4">
            <label className="flex flex-col gap-1.5">
              <span className={LABEL}>Your name</span>
              <input
                type="text"
                autoComplete="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Who we should address"
                className={FIELD}
              />
            </label>

            <label className="flex flex-col gap-1.5">
              <span className={LABEL}>Business name</span>
              <input
                type="text"
                autoComplete="organization"
                value={company}
                onChange={(e) => setCompany(e.target.value)}
                placeholder="Optional — leave blank if it isn't formed yet"
                className={FIELD}
              />
            </label>

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
              <span className={LABEL}>Password</span>
              <PasswordInput
                autoComplete="new-password"
                value={password}
                onChange={setPassword}
                placeholder={`At least ${MIN_PASSWORD} characters`}
                className={FIELD}
              />
            </label>

            {error && <p className={ERROR}>{error}</p>}

            <button type="submit" disabled={submitting} className={BUTTON}>
              {submitting ? "Creating account…" : "Create account"}
              <ArrowRight className="h-4 w-4" />
            </button>
          </form>

          <p className="mt-4 text-xs text-fg-faint">
            {/* Still the legacy pages at their legacy URLs -- plain anchors,
                not <Link>, because the router does not own those routes. */}
            By creating an account you agree to our{" "}
            <a href="/terms.html" className="text-fg-muted hover:underline">
              terms
            </a>{" "}
            and{" "}
            <a href="/privacy.html" className="text-fg-muted hover:underline">
              privacy policy
            </a>
            .
          </p>
        </>
      )}
    </AuthCard>
  );
}
