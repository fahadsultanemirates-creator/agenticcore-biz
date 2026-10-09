import { useCallback, useEffect, useState } from "react";
import { supabase } from "./supabase";

/**
 * Load the signed-in client's own rows from one table.
 *
 * Every panel on the dashboard needs the same four things -- rows, a loading
 * flag, a failed flag and a way to retry -- and writing that effect once per
 * table is how three of them end up handling an error and the fourth renders
 * an empty state that is really a failure. "Nothing here yet" and "we could
 * not load it" look identical and mean opposite things, so the distinction
 * is kept here rather than left to each caller.
 *
 * Row-level security does the filtering: every table below has a
 * `select_own_*` policy comparing auth.uid() to user_id, so there is no
 * `.eq("user_id", …)` here on purpose. Adding one would imply the server
 * trusts the client to ask for the right rows, which it does not have to.
 */
export type OwnRows<T> = {
  rows: T[];
  loading: boolean;
  failed: boolean;
  reload: () => Promise<void>;
};

/**
 * How long to wait before calling it a failure.
 *
 * A request that never comes back is the failure mode nobody designs for.
 * Testing this with the network blocked, every panel sat on "Loading…"
 * indefinitely: the fetch neither resolved nor rejected, so `failed` never
 * became true and no retry was ever offered. On a flaky mobile connection
 * that is a permanent spinner on a paying client's dashboard.
 *
 * Twelve seconds is long enough that a slow-but-working connection is not
 * cut off, and short enough that a broken one admits it.
 */
const QUERY_TIMEOUT_MS = 12_000;

export function useOwnRows<T>(
  table: string,
  columns: string,
  orderBy: { column: string; ascending?: boolean },
): OwnRows<T> {
  const [rows, setRows] = useState<T[]>([]);
  const [loading, setLoading] = useState(true);
  const [failed, setFailed] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setFailed(false);

    const { data: session } = await supabase.auth.getSession();
    if (!session.session) {
      // Signed out: not a failure, just nothing to show. RequireAuth is
      // already sending them to /login.
      setRows([]);
      setLoading(false);
      return;
    }

    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), QUERY_TIMEOUT_MS);

    const { data, error } = await supabase
      .from(table)
      .select(columns)
      .order(orderBy.column, { ascending: orderBy.ascending ?? false })
      .abortSignal(controller.signal);

    clearTimeout(timer);

    if (error) {
      console.error(`Loading ${table} failed:`, error.message);
      setFailed(true);
      setLoading(false);
      return;
    }

    setRows((data ?? []) as T[]);
    setFailed(false);
    setLoading(false);
  }, [table, columns, orderBy.column, orderBy.ascending]);

  useEffect(() => {
    void load();
  }, [load]);

  return { rows, loading, failed, reload: load };
}
