/**
 * One-time migration: move Breeder from user-linked to entity-owned.
 *
 * - Renames legacy `userId` → `mainOwnerUserId` on breeders
 * - Clears `User.breederProfileId` after syncing ownership
 * - Backfills `Breeder.collaborators[]` from active workplace links
 *
 * Run via `npm run migrate:breeder-entity-owned` (or `-- --dry-run`).
 * Do not run `renameHostEntityOwnerField` on breeders — use this migration instead.
 */

import mongoose from "mongoose";
import Breeder from "../../models/Breeder.ts";
import User from "../../models/User.ts";
import WorkplaceRelationship from "../../models/WorkplaceRelationship.ts";

export type MigrateBreederToEntityOwnedSummary = {
  breedersRenamed: number;
  breedersSyncedFromUserLink: number;
  usersCleared: number;
  collaboratorsBackfilled: number;
  warnings: string[];
  errors: string[];
};

export async function migrateBreederToEntityOwned(options?: {
  dryRun?: boolean;
}): Promise<MigrateBreederToEntityOwnedSummary> {
  const dryRun = options?.dryRun ?? false;
  const summary: MigrateBreederToEntityOwnedSummary = {
    breedersRenamed: 0,
    breedersSyncedFromUserLink: 0,
    usersCleared: 0,
    collaboratorsBackfilled: 0,
    warnings: [],
    errors: [],
  };

  try {
    const legacyUserIdCount = await Breeder.collection.countDocuments({
      userId: { $exists: true },
      mainOwnerUserId: { $exists: false },
    });
    summary.breedersRenamed = legacyUserIdCount;

    if (!dryRun && legacyUserIdCount > 0) {
      await Breeder.collection.updateMany(
        { userId: { $exists: true }, mainOwnerUserId: { $exists: false } },
        [{ $set: { mainOwnerUserId: "$userId" } }],
      );
    }
  } catch (error) {
    summary.errors.push(
      `breeders rename: ${error instanceof Error ? error.message : String(error)}`,
    );
  }

  try {
    const usersWithBreederLink = await User.find({
      breederProfileId: { $exists: true, $ne: null },
    })
      .select("_id breederProfileId")
      .lean();

    for (const user of usersWithBreederLink) {
      const breederId = user.breederProfileId;
      if (!breederId) continue;

      const breeder = await Breeder.collection.findOne({ _id: breederId });
      if (!breeder) {
        summary.warnings.push(
          `User ${user._id} references missing breeder ${breederId}`,
        );
        continue;
      }

      if (!breeder.mainOwnerUserId) {
        const ownerId =
          breeder.userId != null ? breeder.userId : user._id;
        summary.breedersSyncedFromUserLink += 1;

        if (!dryRun) {
          await Breeder.collection.updateOne(
            { _id: breederId },
            { $set: { mainOwnerUserId: ownerId } },
          );
        }
      }
    }
  } catch (error) {
    summary.errors.push(
      `breederProfileId sync: ${error instanceof Error ? error.message : String(error)}`,
    );
  }

  try {
    const legacyUserIdRemaining = await Breeder.collection.countDocuments({
      userId: { $exists: true },
    });

    if (!dryRun && legacyUserIdRemaining > 0) {
      await Breeder.collection.updateMany(
        { userId: { $exists: true } },
        { $unset: { userId: "" } },
      );
    }
  } catch (error) {
    summary.errors.push(
      `unset breeder userId: ${error instanceof Error ? error.message : String(error)}`,
    );
  }

  try {
    const usersToClear = await User.collection.countDocuments({
      breederProfileId: { $exists: true, $ne: null },
    });
    summary.usersCleared = usersToClear;

    if (!dryRun && usersToClear > 0) {
      await User.collection.updateMany(
        { breederProfileId: { $exists: true } },
        { $unset: { breederProfileId: "" } },
      );
    }
  } catch (error) {
    summary.errors.push(
      `unset user breederProfileId: ${error instanceof Error ? error.message : String(error)}`,
    );
  }

  try {
    const activeCollaborations = await WorkplaceRelationship.find({
      hostRoleType: "breeder",
      status: "active",
      active: true,
    })
      .select("_id hostRoleProfileId")
      .lean();

    const byBreeder = new Map<string, mongoose.Types.ObjectId[]>();
    for (const collaboration of activeCollaborations) {
      const breederId = String(collaboration.hostRoleProfileId);
      const list = byBreeder.get(breederId) ?? [];
      list.push(collaboration._id as mongoose.Types.ObjectId);
      byBreeder.set(breederId, list);
    }

    summary.collaboratorsBackfilled = byBreeder.size;

    if (!dryRun) {
      for (const [breederId, ids] of byBreeder) {
        await Breeder.findByIdAndUpdate(breederId, {
          $addToSet: { collaborators: { $each: ids } },
        });
      }
    }
  } catch (error) {
    summary.errors.push(
      `collaborators backfill: ${error instanceof Error ? error.message : String(error)}`,
    );
  }

  return summary;
}
