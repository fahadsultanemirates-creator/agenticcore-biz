import type { Session, User } from "@supabase/supabase-js";
import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { supabase } from "../lib/supabase";

type AuthUser = {
  id: string;
  name: string;
  email: string;
  company: string;
};

export type SignupFields = {
  name: string;
  company: string;
  email: string;
  password: string;
  /** Referral code from ?ref= on the signup URL, if there was one. */
  referralCode: string | null;
};

type AuthContextValue = {
  user: AuthUser | null;
  session: Session | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<{ error: string | null }>;
  /** Resolves with needsConfirmation when the project requires the client to
   *  click a link before they have a session -- see signup below. */
  signup: (fields: SignupFields) => Promise<{ error: string | null; needsConfirmation: boolean }>;
  /** Emails a recovery link. Always reports success -- see requestPasswordReset. */
  requestPasswordReset: (email: string) => Promise<{ error: string | null }>;
  /** Sets a new password for whoever is holding a recovery session. */
  setPassword: (password: string) => Promise<{ error: string | null }>;
  logout: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

function nameFromEmail(email: string) {
  const local = email.split("@")[0] ?? "there";
  return local.replace(/[._-]+/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

function metaString(user: User, key: string): string {
  const value = user.user_metadata?.[key];
  return typeof value === "string" ? value.trim() : "";
}

function toAuthUser(user: User | null | undefined): AuthUser | null {
  if (!user) return null;
  // full_name, not name. The handle_new_user trigger reads
  // raw_user_meta_data ->> 'full_name' to populate profiles.full_name, so
  // that is the key the rest of this database already agrees on -- writing
  // 'name' here would leave every new profile row nameless while this page
  // showed the right thing, which is the worst of both.
  return {
    id: user.id,
    name: metaString(user, "full_name") || nameFromEmail(user.email ?? ""),
    email: user.email ?? "",
    company: metaString(user, "company_name"),
  };
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setLoading(false);
    });

    const { data: subscription } = supabase.auth.onAuthStateChange((_event, newSession) => {
      setSession(newSession);
    });

    return () => subscription.subscription.unsubscribe();
  }, []);

  const login: AuthContextValue["login"] = async (email, password) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    return { error: error?.message ?? null };
  };

  // Whether a session comes back depends on a project setting the frontend
  // cannot see: with "Confirm email" on, signUp succeeds with session: null
  // and the client has to click a link first. Reporting only the error would
  // send the caller to /dashboard, where RequireAuth finds nobody and bounces
  // them to /login -- seconds after they chose a password, with no
  // explanation. Say which of the two happened instead of guessing.
  //
  // The metadata keys are not ours to choose. handle_new_user reads
  // full_name, company_name and referred_by out of raw_user_meta_data to
  // build the profiles row, so these three names are a contract with the
  // database, not a local preference.
  const signup: AuthContextValue["signup"] = async ({ name, company, email, password, referralCode }) => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: name.trim() || null,
          company_name: company.trim() || null,
          referred_by: referralCode?.trim() || null,
        },
      },
    });
    if (error) return { error: error.message, needsConfirmation: false };
    return { error: null, needsConfirmation: data.session === null };
  };

  // Deliberately does NOT report whether the address exists. An error like
  // "no account with that email" turns this form into a way to find out who
  // banks with us, which is a privacy leak with no upside -- the
  // honest-looking message is the less safe one.
  const requestPasswordReset: AuthContextValue["requestPasswordReset"] = async (email) => {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset`,
    });
    // Rate limiting is worth surfacing: the client can act on "wait a minute"
    // in a way they cannot act on "that address is unknown".
    if (error && /rate|too many|seconds/i.test(error.message)) return { error: error.message };
    return { error: null };
  };

  const setPassword: AuthContextValue["setPassword"] = async (password) => {
    const { error } = await supabase.auth.updateUser({ password });
    return { error: error?.message ?? null };
  };

  const logout = async () => {
    await supabase.auth.signOut();
  };

  return (
    <AuthContext.Provider
      value={{
        user: toAuthUser(session?.user),
        session,
        loading,
        login,
        signup,
        requestPasswordReset,
        setPassword,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
