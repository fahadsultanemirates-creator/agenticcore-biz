import { useEffect, useState } from "react";
import { supabase } from "./supabase";
import { useOwnRows, type OwnRows } from "./useOwnRows";

/**
 * The shapes the dashboard reads, and the one place their column lists live.
 *
 * Each `select` string is next to the type it produces. When they drift --
 * a column added to the type and not to the string -- the field arrives
 * undefined and renders as a blank, which is the hardest kind of bug to see.
 */

export type RequestRow = {
  id: string;
  service_category: string;
  task_type: string;
  description: string;
  agreed_price: string | null;
  status: "draft" | "awaiting_payment" | "confirmed";
  created_at: string;
};

const REQUEST_COLUMNS =
  "id, service_category, task_type, description, agreed_price, status, created_at";

export function useRequests(): OwnRows<RequestRow> {
  return useOwnRows<RequestRow>("requests", REQUEST_COLUMNS, { column: "created_at" });
}

export type BillingRow = {
  id: string;
  amount: string;
  payment_type: "upfront" | "milestone" | "full" | "recurring";
  status: "pending" | "paid" | "refunded";
  paid_at: string | null;
  created_at: string;
  project_id: string | null;
  request_id: string | null;
};

const BILLING_COLUMNS =
  "id, amount, payment_type, status, paid_at, created_at, project_id, request_id";

export function useBilling(): OwnRows<BillingRow> {
  return useOwnRows<BillingRow>("billing", BILLING_COLUMNS, { column: "created_at" });
}

export type ProjectRow = {
  id: string;
  project_name: string;
  status: "in_progress" | "awaiting_review" | "revision_requested" | "delivered" | "approved";
  revisions_used: number;
  request_id: string;
  created_at: string;
  updated_at: string;
};

const PROJECT_COLUMNS =
  "id, project_name, status, revisions_used, request_id, created_at, updated_at";

export function useProjects(): OwnRows<ProjectRow> {
  return useOwnRows<ProjectRow>("projects", PROJECT_COLUMNS, { column: "updated_at" });
}

export type SubscriptionRow = {
  id: string;
  package_key: string;
  monthly_amount: string;
  status: "active" | "paused" | "cancelled";
  next_due_date: string;
};

const SUBSCRIPTION_COLUMNS = "id, package_key, monthly_amount, status, next_due_date";

export function useSubscriptions(): OwnRows<SubscriptionRow> {
  return useOwnRows<SubscriptionRow>("package_subscriptions", SUBSCRIPTION_COLUMNS, {
    column: "next_due_date",
    ascending: true,
  });
}

/** Money owed right now, in dollars. */
export function amountOutstanding(rows: BillingRow[]): number {
  return rows
    .filter((row) => row.status === "pending")
    .reduce((total, row) => total + Number(row.amount), 0);
}

const STATUS_LABELS: Record<string, string> = {
  draft: "Awaiting scoping",
  awaiting_payment: "Awaiting payment",
  confirmed: "Confirmed",
  in_progress: "In progress",
  awaiting_review: "Ready for your review",
  revision_requested: "Revision requested",
  delivered: "Delivered",
  approved: "Approved",
  pending: "Due",
  paid: "Paid",
  refunded: "Refunded",
  active: "Active",
  paused: "Paused",
  cancelled: "Cancelled",
};

/** "awaiting_review" is a column value, not something to show a client. */
export function statusLabel(status: string): string {
  return STATUS_LABELS[status] ?? status.replace(/_/g, " ");
}

export type ProfileRow = {
  id: string;
  full_name: string | null;
  company_name: string | null;
  referral_code: string;
  total_spend: string;
  is_business_pool: boolean;
  points_balance: string;
};

const PROFILE_COLUMNS =
  "id, full_name, company_name, referral_code, total_spend, is_business_pool, points_balance";

/**
 * The signed-in client's own profile row.
 *
 * Not useOwnRows: this is one row, not a list, and `select_own_profile`
 * already guarantees it is theirs. maybeSingle rather than single because a
 * brand-new account can reach this page in the moment before the
 * handle_new_user trigger's row is visible, and that is not an error worth
 * showing anybody.
 */
export function useProfile() {
  const [profile, setProfile] = useState<ProfileRow | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    const controller = new AbortController();
    // Same twelve-second cap as useOwnRows, and for the same reason: a
    // request that hangs would otherwise leave the greeting blank forever.
    const timer = setTimeout(() => controller.abort(), 12_000);

    void (async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select(PROFILE_COLUMNS)
        .abortSignal(controller.signal)
        .maybeSingle();
      clearTimeout(timer);
      if (!active) return;
      if (error) console.error("Loading profile failed:", error.message);
      // A missing profile is survivable -- the page falls back to the name
      // in the session's metadata -- so there is no failure state here.
      setProfile((data as ProfileRow | null) ?? null);
      setLoading(false);
    })();

    return () => {
      active = false;
      clearTimeout(timer);
    };
  }, []);

  return { profile, loading };
}

export type ConnectionRow = {
  id: string;
  project_id: string;
  provider: string;
  label: string;
  location: string | null;
  notes: string | null;
  status: "requested" | "connected" | "revoked";
  created_at: string;
  updated_at: string;
};

const CONNECTION_COLUMNS =
  "id, project_id, provider, label, location, notes, status, created_at, updated_at";

/**
 * Every connection across the client's projects.
 *
 * Loaded in one query rather than per project: a client has a handful of
 * projects and a handful of connections, and one request that the project
 * cards can all count from beats N requests that each render a spinner.
 */
export function useConnections(): OwnRows<ConnectionRow> {
  return useOwnRows<ConnectionRow>("project_connections", CONNECTION_COLUMNS, {
    column: "created_at",
    ascending: true,
  });
}

export async function addConnection(input: {
  projectId: string;
  provider: string;
  label: string;
  location: string;
  notes: string;
}): Promise<{ ok: true } | { error: string }> {
  const { data: session } = await supabase.auth.getSession();
  const userId = session.session?.user.id;
  if (!userId) return { error: "Your session expired. Please sign in again." };

  const { error } = await supabase.from("project_connections").insert({
    project_id: input.projectId,
    user_id: userId,
    provider: input.provider,
    label: input.label.trim(),
    location: input.location.trim() || null,
    notes: input.notes.trim() || null,
  });

  if (error) {
    console.error("addConnection failed:", error.message);
    // The owner-matches trigger and the shape checks both surface here. A
    // client cannot trigger either through the UI, so anything that arrives
    // is a bug on our side rather than something they can fix by retyping.
    return { error: "We couldn't save that. Please try again." };
  }
  return { ok: true };
}

export async function setConnectionStatus(
  id: string,
  status: ConnectionRow["status"],
): Promise<boolean> {
  const { error } = await supabase.from("project_connections").update({ status }).eq("id", id);
  if (error) console.error("setConnectionStatus failed:", error.message);
  return !error;
}

export async function removeConnection(id: string): Promise<boolean> {
  const { error } = await supabase.from("project_connections").delete().eq("id", id);
  if (error) console.error("removeConnection failed:", error.message);
  return !error;
}
