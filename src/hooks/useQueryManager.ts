import type { AsyncDuckDBConnection } from "@duckdb/duckdb-wasm";
import { useCallback, useEffect, useRef, useState } from "react";
import { connect, getStatus, subscribeToStatus } from "../utils/duckdb";
import { deepConvert, type DuckDBRow, type Row } from "../utils/deep-convert";

interface UseQueryManagerOptions {
  onStatusChange?: (status: string) => void;
}

export interface QueryManager {
  isReady: boolean;
  query: (sql: string, params?: any[]) => Promise<any[]>;
  prepare: (sql: string) => Promise<any>;
}

/**
 * Hook that provides a connection to the shared DuckDB instance.
 *
 * The database itself (worker, WASM, tables, indices) is a module-level
 * singleton, so mounting and unmounting components — collapsing a panel, for
 * instance — is cheap and never reloads the data. Only the connection is tied
 * to the component's lifetime.
 */
export const useQueryManager = (
  options?: UseQueryManagerOptions,
): QueryManager => {
  const connRef = useRef<AsyncDuckDBConnection | null>(null);
  const [isReady, setIsReady] = useState(false);

  // Keep the latest callback without re-running the connection effect
  const onStatusChangeRef = useRef(options?.onStatusChange);
  onStatusChangeRef.current = options?.onStatusChange;

  useEffect(() => {
    let cancelled = false;

    const unsubscribe = subscribeToStatus((status) =>
      onStatusChangeRef.current?.(status),
    );
    onStatusChangeRef.current?.(getStatus());

    connect()
      .then((conn) => {
        if (cancelled) {
          conn.close().catch(console.error);
          return;
        }
        connRef.current = conn;
        setIsReady(true);
      })
      .catch((err) => {
        console.error("Failed to connect to database:", err);
      });

    return () => {
      cancelled = true;
      unsubscribe();
      const conn = connRef.current;
      connRef.current = null;
      conn?.close().catch(console.error);
    };
  }, []);

  const query = useCallback(async (sql: string, params?: any[]) => {
    const conn = connRef.current;
    if (!conn) throw new Error("Database not ready");
    try {
      let result;
      if (params && params.length > 0) {
        // Use prepared statement for parameterized queries
        const statement = await conn.prepare(sql);
        result = await statement.query(...params);
        await statement.close();
      } else {
        // Use direct query for non-parameterized queries (required for PIVOT and other complex statements)
        result = await conn.query(sql);
      }
      return result
        .toArray()
        .map((row: DuckDBRow) =>
          Object.fromEntries(
            Object.entries(row.toJSON()).map(([k, v]) => [k, deepConvert(v)]),
          ),
        ) satisfies Row[];
    } catch (err: any) {
      console.error("DuckDB query failed", { sql, params, err });
      // Re-throw a more informative error for the UI
      const message = `DuckDB query error: ${err?.message || err} -- SQL: ${sql} -- params: ${JSON.stringify(
        params,
      )}`;
      const e = new Error(message);
      // preserve original stack if available
      if (err?.stack) e.stack = `${e.stack}\nCaused by: ${err.stack}`;
      throw e;
    }
  }, []);

  const prepare = useCallback(async (sql: string) => {
    const conn = connRef.current;
    if (!conn) throw new Error("Database not ready");
    return conn.prepare(sql);
  }, []);

  return { isReady, query, prepare };
}
