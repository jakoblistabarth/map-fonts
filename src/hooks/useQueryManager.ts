import { useEffect, useState } from "react";

interface UseQueryManagerOptions {
  onStatusChange?: (status: string) => void;
}

export interface QueryManager {
  isReady: boolean;
  query: (sql: string, params?: any[]) => Promise<any[]>;
  prepare: (sql: string) => Promise<any>;
  close: () => Promise<void>;
}

/**
 * Hook that manages a persistent DuckDB connection for the component's lifetime
 * Loads parquet files once on mount, and provides a query function
 */
export function useQueryManager(
  options?: UseQueryManagerOptions,
): QueryManager {
  const [db, setDb] = useState<any>(null);
  const [conn, setConn] = useState<any>(null);
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    const setupDatabase = async () => {
      try {
        options?.onStatusChange?.("Initializing DuckDB-WASM...");

        // Import DuckDB WASM
        const duckdbModule: any = await import("@duckdb/duckdb-wasm");
        const duckdb: any = duckdbModule.default ?? duckdbModule;

        // Use manual bundles and let duckdb select the right one for this environment
        const MANUAL_BUNDLES: any = {
          mvp: {
            mainModule: "/duckdb/duckdb.wasm",
            mainWorker: "/duckdb/duckdb.worker.js",
            pthreadWorker: "/duckdb/duckdb.pthread.worker.js",
          },
        };

        const bundle = await duckdb.selectBundle(MANUAL_BUNDLES);
        console.log("[DuckDB] Selected bundle:", bundle.mainModule);

        const logger = new duckdb.ConsoleLogger();
        const worker = new Worker(bundle.mainWorker);
        const newDb = new duckdb.AsyncDuckDB(logger, worker);

        console.log("[DuckDB] Instantiating with WASM module...");
        // Pass pthreadWorker as second arg so the runtime can wire threads if available
        await newDb.instantiate(bundle.mainModule, bundle.pthreadWorker);

        console.log("[DuckDB] Creating connection...");
        const newConn = await newDb.connect();

        // Ensure httpfs is loaded
        console.log("[DuckDB] Initializing httpfs extension...");
        try {
          await newConn.query("INSTALL httpfs");
          await newConn.query("LOAD httpfs");
          console.log("[DuckDB] httpfs loaded successfully");
        } catch (e) {
          console.warn("[DuckDB] httpfs already loaded or unavailable:", e);
        }

        // Load parquet files
        options?.onStatusChange?.("Loading Parquet files...");

        const tables = ["tags", "family_metadata", "maesured_values"];
        for (const table of tables) {
          try {
            options?.onStatusChange?.(`Loading ${table}...`);
            const parquetUrl = `/data/${table}.parquet`;
            console.log(`[${table}] Loading from: ${parquetUrl}`);

            // Use absolute URL to ensure file is accessible
            const fullUrl = new URL(parquetUrl, window.location.href).href;
            console.log(`[${table}] Full URL: ${fullUrl}`);

            await newConn.query(
              `CREATE OR REPLACE TABLE ${table} AS SELECT * FROM read_parquet('${fullUrl}')`,
            );
            console.log(`[${table}] Created table successfully`);
          } catch (err: any) {
            console.error(`[${table}] Failed to load:`, err);
            options?.onStatusChange?.(`Error loading ${table}: ${err.message}`);
          }
        }

        options?.onStatusChange?.("Ready! Database loaded with all tables.");

        setDb(newDb);
        setConn(newConn);
        setIsReady(true);
      } catch (err: any) {
        options?.onStatusChange?.(`Error: ${err.message}`);
        console.error("Failed to setup database:", err);
      }
    };

    setupDatabase();

    return () => {
      // Cleanup on unmount
      if (conn) {
        conn.close().catch(console.error);
      }
      if (db) {
        db.terminate().catch(console.error);
      }
    };
  }, []);

  const query = async (sql: string, params?: any[]) => {
    if (!conn) throw new Error("Database not ready");
    try {
      const statement = await conn.prepare(sql);
      const result = params
        ? await statement.query(...params)
        : await statement.query();
      await statement.close();
      return result.toArray ? result.toArray() : result;
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
  };

  const prepare = async (sql: string) => {
    if (!conn) throw new Error("Database not ready");
    return conn.prepare(sql);
  };

  const close = async () => {
    if (conn) await conn.close();
    if (db) await db.terminate();
    setIsReady(false);
  };

  return { isReady, query, prepare, close };
}
