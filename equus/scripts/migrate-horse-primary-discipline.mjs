/**
 * One-time migration: fold Horse.primaryDiscipline into disciplines[], then unset it.
 *
 * Usage (from equus/):
 *   node --env-file=.env.local scripts/migrate-horse-primary-discipline.mjs
 *
 * Requires MONGODB_URI (and optional MONGODB_DB_NAME, default "equus").
 * Safe to re-run: horses without primaryDiscipline are skipped.
 */

import { MongoClient } from "mongodb";

/** Mirrors `lib/utils/mergePrimaryDiscipline.ts` (keep in sync). */
function mergePrimaryDisciplineIntoDisciplines(primaryDiscipline, disciplines) {
  const existing = Array.isArray(disciplines) ? [...disciplines] : [];
  if (
    typeof primaryDiscipline === "string" &&
    primaryDiscipline.length > 0 &&
    !existing.includes(primaryDiscipline)
  ) {
    existing.push(primaryDiscipline);
  }
  return existing;
}

const uri = process.env.MONGODB_URI?.trim() || process.env.MONGO_DB_NAME?.trim();
const dbName = process.env.MONGODB_DB_NAME?.trim() || "equus";

if (!uri) {
  console.error("MONGODB_URI is not defined");
  process.exit(1);
}

const client = new MongoClient(uri);

try {
  await client.connect();
  const horses = client.db(dbName).collection("horses");

  const cursor = horses.find({ primaryDiscipline: { $exists: true, $ne: null } });
  let migrated = 0;

  for await (const doc of cursor) {
    const disciplines = mergePrimaryDisciplineIntoDisciplines(
      doc.primaryDiscipline,
      doc.disciplines,
    );

    await horses.updateOne(
      { _id: doc._id },
      {
        $set: { disciplines },
        $unset: { primaryDiscipline: "" },
      },
    );
    migrated += 1;
  }

  try {
    await horses.dropIndex("saleStatus_1_primaryDiscipline_1");
    console.log("Dropped index saleStatus_1_primaryDiscipline_1");
  } catch (err) {
    if (err?.codeName !== "IndexNotFound" && err?.code !== 27) {
      throw err;
    }
  }

  console.log(`Migrated ${migrated} horse(s).`);
} finally {
  await client.close();
}
