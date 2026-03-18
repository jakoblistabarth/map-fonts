import { DuckDBInstance } from "@duckdb/node-api";
import * as fs from "fs";
import path from "path";

async function main(): Promise<void> {
  const dataDir = path.join(process.cwd(), "public", "data");
  const sqlPath = path.join(process.cwd(), "scripts", "load-metadata.sql");

  // Create output directory if it doesn't exist
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }

  console.log(`Creating database and exporting tables...`);

  // Create a DuckDB instance
  const instance = await DuckDBInstance.create(":memory:");
  const conn = await instance.connect();

  try {
    // Read the SQL file
    const sql = fs.readFileSync(sqlPath, "utf-8");

    // Execute the SQL statements
    console.log("Executing SQL loader...");
    const statements = sql
      .split(";")
      .map((s) => s.trim())
      .filter((s) => s.length > 0 && !s.startsWith("--"));

    let successCount = 0;
    for (const statement of statements) {
      try {
        console.log(`  ${statement.substring(0, 70)}...`);
        await conn.run(statement);
        successCount++;
      } catch (err: any) {
        console.warn(`    ✗ ${err.message}`);
      }
    }

    console.log(`\n✓ Successfully executed ${successCount} statements`);
    console.log(`✓ Table files exported to ${dataDir}`);

    conn.closeSync();
  } catch (err: any) {
    console.error("Error creating database:", err);
    conn.closeSync();
    process.exit(1);
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
