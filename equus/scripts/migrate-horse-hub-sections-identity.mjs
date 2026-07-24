/**
 * One-time migration: Horse.hubSections.overview → identity; ensure identification.
 *
 * Usage (from equus/):
 *   node --env-file=.env.local scripts/migrate-horse-hub-sections-identity.mjs
 *
 * Safe to re-run: horses without overview are skipped for the copy step.
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

  const withOverview = await horses
    .find({ "hubSections.overview": { $exists: true } })
    .toArray();

  let copied = 0;
  for (const horse of withOverview) {
    const overviewMode = horse.hubSections?.overview?.mode;
    const identityMode = horse.hubSections?.identity?.mode;
    const set = {};
    const unset = { "hubSections.overview": "" };

    if (overviewMode && !identityMode) {
      set["hubSections.identity"] = { mode: overviewMode };
    }
    if (!horse.hubSections?.identification?.mode) {
      set["hubSections.identification"] = { mode: "public" };
    }

    const update = {};
    if (Object.keys(set).length > 0) update.$set = set;
    update.$unset = unset;

    await horses.updateOne({ _id: horse._id }, update);
    copied += 1;
  }

  const missingIdentification = await horses.updateMany(
    {
      $or: [
        { "hubSections.identification": { $exists: false } },
        { "hubSections.identification.mode": { $exists: false } },
      ],
    },
    { $set: { "hubSections.identification": { mode: "public" } } },
  );

  const missingIdentity = await horses.updateMany(
    {
      $or: [
        { "hubSections.identity": { $exists: false } },
        { "hubSections.identity.mode": { $exists: false } },
      ],
    },
    { $set: { "hubSections.identity": { mode: "public" } } },
  );

  console.log(
    `Migrated overview→identity: ${copied}; set identification defaults: ${missingIdentification.modifiedCount}; set identity defaults: ${missingIdentity.modifiedCount}`,
  );
} finally {
  await client.close();
}
