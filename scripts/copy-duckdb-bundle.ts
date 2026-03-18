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

  if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });

  const files = fs.readdirSync(pkgDir);
  const variants = ["mvp", "eh", "coi"];

  for (const variant of variants) {
    const wasm = `duckdb-${variant}.wasm`;
    const worker = `duckdb-browser-${variant}.worker.js`;
    const pthreadWorker = `duckdb-browser-${variant}.pthread.worker.js`;

    if (files.includes(wasm)) {
      fs.copyFileSync(
        path.join(pkgDir, wasm),
        path.join(outDir, `duckdb-${variant}.wasm`),
      );
      console.log(`Copied ${wasm}`);
    }

    if (files.includes(worker)) {
      fs.copyFileSync(
        path.join(pkgDir, worker),
        path.join(outDir, `duckdb-browser-${variant}.worker.js`),
      );
      console.log(`Copied ${worker}`);
    }

    if (files.includes(pthreadWorker)) {
      fs.copyFileSync(
        path.join(pkgDir, pthreadWorker),
        path.join(outDir, `duckdb-browser-${variant}.pthread.worker.js`),
      );
      console.log(`Copied ${pthreadWorker}`);
    }
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
