/**
 * CLI entry for migrateBreederToEntityOwned — connects to MONGODB_URI and runs migration.
 *
 * Usage: npm run migrate:breeder-entity-owned [-- --dry-run]
 */

import connectDb from "../lib/db.ts";
import { migrateBreederToEntityOwned } from "../lib/migrations/migrateBreederToEntityOwned.ts";

const dryRun = process.argv.includes("--dry-run");

async function main() {
  await connectDb();

  const summary = await migrateBreederToEntityOwned({ dryRun });

  console.log(dryRun ? "Dry run complete:" : "Migration complete:");
  console.log(JSON.stringify(summary, null, 2));

  if (summary.errors.length > 0) {
    process.exit(1);
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
