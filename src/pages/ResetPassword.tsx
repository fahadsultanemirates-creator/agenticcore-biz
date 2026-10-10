// The way back in after a forgotten password.
//
// One route does both halves of the job, because the client arrives at the
// same URL twice and should not have to understand why. Arriving from the
// sign-in link there is no recovery session, so they get the "email me a
// link" form. Arriving from the emailed link, supabase-js has already
// exchanged the token in the URL for a recovery session by the time this
// renders, so they get the "choose a new password" form instead.

import { ArrowRight, MailCheck } from "lucide-react";
import { useEffect, useState, type FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import { AuthCard, BUTTON, ERROR, FIELD, LABEL, LINK } from "../components/auth/AuthCard";
import { PasswordInput } from "../components/PasswordInput";
import { useAuth } from "../context/AuthContext";
import { ARRIVED_FOR_RECOVERY, supabase } from "../lib/supabase";

const MIN_PASSWORD = 8;

export function ResetPassword() {
  const { requestPasswordReset, setPassword } = useAuth();
  const navigate = useNavigate();

  // Seeded from the flag captured at module load, before supabase-js could
  // strip the fragment. Starting at false meant a client who arrived from
  // the email could be shown the "email me a link" form while holding a
  // perfectly good recovery session -- see the race below.
  const [recovering, setRecovering] = useState(ARRIVED_FOR_RECOVERY);
  const [email, setEmail] = useState("");
  const [password, setPasswordValue] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState("");
  const [sent, setSent] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Three ways to find out we are mid-recovery, because they race, and the
  // first two can both lose.
  //
  // The event fires when supabase-js finishes reading the token out of the
  // URL -- which may already have happened before this component mounted,
  // in which case no event is coming. The hash check covers that, except
  // supabase-js clears the fragment once it has used it, so by the time
  // anything reads it the evidence may be gone. That leaves a client holding
  // a valid recovery session being shown the "email me a link" form, which
  // is the one thing this page exists to avoid. App.tsx redirecting here
  // from another route makes it likelier still, by mounting this component
  // later.
  //
  // So the real answer is the flag read at module load, above createClient,
  // which cannot be raced. The other two stay as belt and braces.
  useEffect(() => {
    const { data: sub } = supabase.auth.onAuthStateChange((event) => {
      if (event === "PASSWORD_RECOVERY") setRecovering(true);
    });
    void supabase.auth.getSession().then(({ data }) => {
      if (data.session && window.location.hash.includes("type=recovery")) setRecovering(true);
    });
    return () => sub.subscription.unsubscribe();
  }, []);

  const handleRequest = async (e: FormEvent) => {
    e.preventDefault();
    if (!email.trim()) {
      setError("Enter the email address you signed up with.");
      return;
    }
    setError("");
    setSubmitting(true);
    const { error: requestError } = await requestPasswordReset(email.trim());
    setSubmitting(false);
    if (requestError) {
      setError(requestError);
      return;
    }
    setSent(true);
  };

  const handleSet = async (e: FormEvent) => {
    e.preventDefault();
    if (password.length < MIN_PASSWORD) {
      setError(`Password must be at least ${MIN_PASSWORD} characters.`);
      return;
    }
    if (password !== confirm) {
      setError("Those two passwords don't match.");
      return;
    }
    setError("");
    setSubmitting(true);
    const { error: saveError } = await setPassword(password);
    setSubmitting(false);
    if (saveError) {
      setError(saveError);
      return;
    }
    // Already signed in by the recovery session, so there is nothing to sign
    // into -- go straight where they were trying to get.
    navigate("/dashboard", { replace: true });
  };

  return (
    <AuthCard
      footer={
        <Link to="/login" className={LINK}>
          Back to sign in
        </Link>
      }
    >
      {recovering ? (
        <>
          <h1 className="font-display text-2xl font-semibold text-fg">Choose a new password</h1>
          <p className="mt-1.5 text-sm text-fg-muted">You'll be signed in as soon as it's saved.</p>

          <form onSubmit={handleSet} className="mt-6 flex flex-col gap-4">
            <label className="flex flex-col gap-1.5">
              <span className={LABEL}>New password</span>
              <PasswordInput
                autoComplete="new-password"
                value={password}
                onChange={setPasswordValue}
                placeholder={`At least ${MIN_PASSWORD} characters`}
                className={FIELD}
              />
            </label>
            <label className="flex flex-col gap-1.5">
              <span className={LABEL}>Confirm password</span>
              <PasswordInput
                autoComplete="new-password"
                value={confirm}
                onChange={setConfirm}
                placeholder="Type it again"
                className={FIELD}
              />
            </label>

            {error && <p className={ERROR}>{error}</p>}

            <button type="submit" disabled={submitting} className={BUTTON}>
              {submitting ? "Saving…" : "Save password"}
              <ArrowRight className="h-4 w-4" />
            </button>
          </form>
        </>
      ) : sent ? (
        <>
          <MailCheck className="h-8 w-8 text-orange-400" />
          <h1 className="mt-3 font-display text-2xl font-semibold text-fg">Check your email</h1>
          {/* Worded so it is true whether or not that address has an account,
              which is the point -- see requestPasswordReset. */}
          <p className="mt-1.5 text-sm text-fg-muted">
            If there's an account for {email.trim()}, a reset link is on its way. The link opens
            this page again and lets you set a new password.
          </p>
          <p className="mt-4 text-sm text-fg-faint">
            Nothing after a few minutes? Check spam, then try again.
          </p>
        </>
      ) : (
        <>
          <h1 className="font-display text-2xl font-semibold text-fg">Reset your password</h1>
          <p className="mt-1.5 text-sm text-fg-muted">We'll email you a link to set a new one.</p>

          <form onSubmit={handleRequest} className="mt-6 flex flex-col gap-4">
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

            {error && <p className={ERROR}>{error}</p>}

            <button type="submit" disabled={submitting} className={BUTTON}>
              {submitting ? "Sending…" : "Email me a link"}
              <ArrowRight className="h-4 w-4" />
            </button>
          </form>
        </>
      )}
    </AuthCard>
  );
}
