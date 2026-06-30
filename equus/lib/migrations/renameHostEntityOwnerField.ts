/**
 * One-time migration: rename `userId` → `mainOwnerUserId` on host entity collections.
 *
 * Collections: stables, ridingclubs, transports. Breeder keeps `userId`.
 * Run via `npm run migrate:host-owner-field` (or `-- --dry-run`).
 */

import Stable from "../../models/Stable.ts";
import RidingClub from "../../models/RidingClub.ts";
import Transport from "../../models/Transport.ts";

export type HostOwnerFieldMigrationSummary = {
  stablesRenamed: number;
  ridingClubsRenamed: number;
  transportsRenamed: number;
  errors: string[];
};

const COLLECTIONS = [
  { name: "stables", model: Stable, key: "stablesRenamed" as const },
  { name: "ridingclubs", model: RidingClub, key: "ridingClubsRenamed" as const },
  { name: "transports", model: Transport, key: "transportsRenamed" as const },
];

/** Rename legacy `userId` to `mainOwnerUserId` on host profile collections. */
export async function renameHostEntityOwnerField(options?: {
  dryRun?: boolean;
}): Promise<HostOwnerFieldMigrationSummary> {
  const dryRun = options?.dryRun ?? false;
  const summary: HostOwnerFieldMigrationSummary = {
    stablesRenamed: 0,
    ridingClubsRenamed: 0,
    transportsRenamed: 0,
    errors: [],
  };

  for (const { name, model, key } of COLLECTIONS) {
    try {
      const count = await model.collection.countDocuments({ userId: { $exists: true } });
      summary[key] = count;

      if (!dryRun && count > 0) {
        await model.collection.updateMany(
          { userId: { $exists: true } },
          { $rename: { userId: "mainOwnerUserId" } },
        );
      }
    } catch (error) {
      summary.errors.push(
        `${name}: ${error instanceof Error ? error.message : String(error)}`,
      );
    }
  }

  return summary;
}
