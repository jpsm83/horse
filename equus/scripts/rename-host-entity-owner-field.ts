/**
 * CLI entry for renameHostEntityOwnerField — connects to MONGODB_URI and runs migration.
 *
 * Usage: npm run migrate:host-owner-field [-- --dry-run]
 */

import connectDb from "../lib/db.ts";
import { renameHostEntityOwnerField } from "../lib/migrations/renameHostEntityOwnerField.ts";

const dryRun = process.argv.includes("--dry-run");

async function main() {
  await connectDb();

  const summary = await renameHostEntityOwnerField({ dryRun });

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
