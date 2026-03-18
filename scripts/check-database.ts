import fs from "fs";
import path from "path";

/**
 * Check if parquet files exist, and only run prepare:database if needed
 */
async function checkAndPrepare(): Promise<void> {
  const dataDir = path.join(process.cwd(), "public", "data");
  const requiredFiles = [
    "tags.parquet",
    "family_metadata.parquet",
    "maesured_values.parquet",
  ];

  // Check if all files exist
  const allExist = requiredFiles.every((file) => {
    const filePath = path.join(dataDir, file);
    const exists = fs.existsSync(filePath);
    if (exists) {
      console.log(`✓ ${file} found`);
    }
    return exists;
  });

  if (allExist) {
    console.log(
      "\n✓ All Parquet files already exist. Skipping database creation.",
    );
    return;
  }

  console.log("\n⚠ Some Parquet files are missing. Creating database...\n");

  // Run the prepare:database script
  const { execSync } = await import("child_process");
  try {
    execSync("pnpm run prepare:database", { stdio: "inherit" });
  } catch (err: any) {
    console.error("Failed to prepare database:", err.message);
    process.exit(1);
  }
}

checkAndPrepare().catch((err) => {
  console.error(err);
  process.exit(1);
});
