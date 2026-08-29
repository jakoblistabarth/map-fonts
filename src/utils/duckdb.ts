import type {
  AsyncDuckDB,
  AsyncDuckDBConnection,
  DuckDBBundles,
} from "@duckdb/duckdb-wasm";

/**
 * Module-level DuckDB singleton.
 *
 * Booting DuckDB is expensive: it spawns a worker, instantiates the WASM
 * module, downloads every parquet file and builds the vector indices. All of
 * that must happen exactly once per page load, no matter how many components
 * (or Astro islands) need to query. Components get their own *connection* to
 * this shared database instead, which is cheap to create and dispose.
 */

const TABLES = [
  "tags",
  "family_metadata",
  "measured_values",
  "font_metrics",
] as const;

let dbPromise: Promise<AsyncDuckDB> | null = null;

let currentStatus = "Initializing...";
const statusListeners = new Set<(status: string) => void>();

const setStatus = (status: string) => {
  currentStatus = status;
  for (const listener of statusListeners) listener(status);
};

/** The most recent bootstrap status, for components mounting mid-flight. */
export const getStatus = () => {
  return currentStatus;
};

/** Subscribe to bootstrap status updates. Returns an unsubscribe function. */
export const subscribeToStatus = (listener: (status: string) => void) => {
  statusListeners.add(listener);
  return () => {
    statusListeners.delete(listener);
  };
};

const getBasePath = () => {
  const baseUrl = import.meta.env.BASE_URL;
  return baseUrl.endsWith("/") ? baseUrl : baseUrl + "/";
};

const bootstrap = async (): Promise<AsyncDuckDB> => {
  setStatus("Initializing DuckDB-WASM...");

  const duckdbModule = await import("@duckdb/duckdb-wasm");
  const duckdb = (duckdbModule as any).default ?? duckdbModule;

  // Use manual bundles and let duckdb select the right one for this environment
  const basePath = getBasePath();
  const MANUAL_BUNDLES: DuckDBBundles = {
    mvp: {
      mainModule: `${basePath}duckdb/duckdb-mvp.wasm`,
      mainWorker: `${basePath}duckdb/duckdb-browser-mvp.worker.js`,
    },
    eh: {
      mainModule: `${basePath}duckdb/duckdb-eh.wasm`,
      mainWorker: `${basePath}duckdb/duckdb-browser-eh.worker.js`,
    },
  };

  const bundle = await duckdb.selectBundle(MANUAL_BUNDLES);
  console.log("[DuckDB] Selected bundle:", bundle.mainModule);

  const logger = new duckdb.ConsoleLogger();
  const worker = new Worker(bundle.mainWorker);
  const db: AsyncDuckDB = new duckdb.AsyncDuckDB(logger, worker);

  console.log("[DuckDB] Instantiating with WASM module...");
  // Pass pthreadWorker as second argument so the runtime can wire threads if available
  await db.instantiate(bundle.mainModule, bundle.pthreadWorker);

  console.log("[DuckDB] Creating bootstrap connection...");
  const conn = await db.connect();

  try {
    setStatus("Loading table files...");

    for (const table of TABLES) {
      setStatus(`Loading ${table}...`);
      const tableFileUrl = `${basePath}data/${table}.parquet`;
      console.log(`[${table}] Loading from: ${tableFileUrl}`);

      // Fetch the parquet file as a blob
      const response = await fetch(tableFileUrl);
      if (!response.ok) {
        throw new Error(
          `Failed to fetch ${table}.parquet: ${response.status} ${response.statusText}`,
        );
      }

      const arrayBuffer = await response.arrayBuffer();

      // Register the buffer as a file in DuckDB's virtual filesystem
      const fileName = `/${table}.parquet`;
      await db.registerFileBuffer(fileName, new Uint8Array(arrayBuffer));

      // Load from the registered file
      await conn.query(
        `CREATE OR REPLACE TABLE ${table} AS FROM '${fileName}'`,
      );
      console.log(`[${table}] Created table successfully`);
    }

    // Create vector indices
    setStatus("Building vector indices...");
    const sqlResponse = await fetch(`${basePath}vector-search.sql`);
    if (!sqlResponse.ok) {
      throw new Error(
        `Failed to fetch vector-search.sql: ${sqlResponse.status} ${sqlResponse.statusText}`,
      );
    }
    const sqlText = await sqlResponse.text();

    // Split by semicolons and execute each statement
    for (const statement of sqlText.split(";")) {
      if (statement.trim()) await conn.query(statement);
    }

    setStatus("Ready! Database loaded with all tables.");
    return db;
  } finally {
    await conn.close();
  }
};

/**
 * Returns the shared DuckDB instance, booting it on first call.
 * Concurrent callers await the same promise; a failed bootstrap is not cached,
 * so a later caller can retry.
 */
export const getDuckDB = (): Promise<AsyncDuckDB> => {
  dbPromise ??= bootstrap().catch((err) => {
    setStatus(`Error: ${err?.message ?? err}`);
    console.error("Failed to setup database:", err);
    dbPromise = null;
    throw err;
  });
  return dbPromise;
};

/** Opens a connection to the shared database. Remember to close it. */
export const connect = async (): Promise<AsyncDuckDBConnection> => {
  const db = await getDuckDB();
  return db.connect();
};

/** Tears down the shared instance. Only needed for tests/debugging. */
export const terminateDuckDB = async () => {
  const pending = dbPromise;
  if (!pending) return;
  dbPromise = null;
  currentStatus = "Initializing...";
  const db = await pending;
  await db.terminate();
};
