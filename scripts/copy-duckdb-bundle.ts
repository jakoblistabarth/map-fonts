import fs from "fs";
import path from "path";

async function main(): Promise<void> {
  const pkgDir = path.join(
    process.cwd(),
    "node_modules",
    "@duckdb",
    "duckdb-wasm",
    "dist",
  );
  const outDir = path.join(process.cwd(), "public", "duckdb");

  if (!fs.existsSync(pkgDir)) {
    console.error("duckdb-wasm dist folder not found at", pkgDir);
    process.exit(1);
  }

  if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });

  const files = fs.readdirSync(pkgDir);

  // Try to find files matching common patterns
  const candidates = [
    { variant: "mvp", pthread: "coi" },
    { variant: "eh", pthread: "eh" },
    { variant: "coi", pthread: "coi" },
  ];

  let chosen: { wasm: string; worker: string; pthreadWorker: string } | null =
    null;

  for (const { variant, pthread } of candidates) {
    const wasm = `duckdb-${variant}.wasm`;
    const worker = `duckdb-browser-${variant}.worker.js`;
    const pthreadWorker = `duckdb-browser-${pthread}.pthread.worker.js`;

    if (
      files.includes(wasm) &&
      files.includes(worker) &&
      files.includes(pthreadWorker)
    ) {
      chosen = { wasm, worker, pthreadWorker };
      break;
    }
  }

  if (!chosen) {
    console.error("No suitable duckdb wasm/worker pair found in", pkgDir);
    console.error("Available files:\n", files.join("\n"));
    process.exit(1);
  }

  const srcWasm = path.join(pkgDir, chosen.wasm);
  const srcWorker = path.join(pkgDir, chosen.worker);
  const srcPthreadWorker = path.join(pkgDir, chosen.pthreadWorker);
  const dstWasm = path.join(outDir, "duckdb.wasm");
  const dstWorker = path.join(outDir, "duckdb.worker.js");
  const dstPthreadWorker = path.join(outDir, "duckdb.pthread.worker.js");

  fs.copyFileSync(srcWasm, dstWasm);
  fs.copyFileSync(srcWorker, dstWorker);
  fs.copyFileSync(srcPthreadWorker, dstPthreadWorker);

  console.log("Copied", chosen.wasm, "->", dstWasm);
  console.log("Copied", chosen.worker, "->", dstWorker);
  console.log("Copied", chosen.pthreadWorker, "->", dstPthreadWorker);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
