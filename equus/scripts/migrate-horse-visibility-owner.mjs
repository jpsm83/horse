/**
 * One-time migration: Horse.profileVisibility `owner_only` → `owner`.
 *
 * Usage (from equus/):
 *   node --env-file=.env.local scripts/migrate-horse-visibility-owner.mjs
 */

import { MongoClient } from "mongodb";

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
  const result = await horses.updateMany(
    { profileVisibility: "owner_only" },
    { $set: { profileVisibility: "owner" } },
  );
  console.log(`Migrated profileVisibility owner_only → owner: ${result.modifiedCount} horse(s).`);
} finally {
  await client.close();
}
