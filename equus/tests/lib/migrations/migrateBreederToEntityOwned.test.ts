import { describe, expect, it } from "vitest";
import mongoose from "mongoose";

import Breeder from "@/models/Breeder.ts";
import User from "@/models/User.ts";
import WorkplaceRelationship from "@/models/WorkplaceRelationship.ts";
import { migrateBreederToEntityOwned } from "@/lib/migrations/migrateBreederToEntityOwned.ts";
import * as userService from "@/lib/services/userService.ts";

describe("migrateBreederToEntityOwned", () => {
  it("renames userId to mainOwnerUserId on breeders collection", async () => {
    const user = await userService.createCredentialsUser({
      email: "migrate-breeder@example.com",
      password: "TestPass1!",
    });
    const legacyId = new mongoose.Types.ObjectId();

    await Breeder.collection.insertOne({
      _id: legacyId,
      userId: user._id,
      operationName: "Legacy Breeder",
      description: "Legacy",
      email: "legacy@example.com",
      phoneNumber: "+351900000000",
      address: { country: "PT", city: "Lisbon", street: "A", postCode: "1000" },
    });

    const summary = await migrateBreederToEntityOwned();
    expect(summary.breedersRenamed).toBeGreaterThanOrEqual(1);
    expect(summary.errors).toEqual([]);

    const updated = await Breeder.collection.findOne({ _id: legacyId });
    expect(updated?.mainOwnerUserId).toBeDefined();
    expect(updated?.userId).toBeUndefined();
  });

  it("clears breederProfileId on users after syncing ownership", async () => {
    const user = await userService.createCredentialsUser({
      email: "migrate-breeder-user-link@example.com",
      password: "TestPass1!",
    });
    const breederId = new mongoose.Types.ObjectId();

    await Breeder.collection.insertOne({
      _id: breederId,
      userId: user._id,
      operationName: "Linked Breeder",
      description: "Linked",
      email: "linked@example.com",
      phoneNumber: "+351900000001",
      address: { country: "PT", city: "Lisbon", street: "B", postCode: "1000" },
    });

    await User.collection.updateOne(
      { _id: user._id },
      { $set: { breederProfileId: breederId } },
    );

    const summary = await migrateBreederToEntityOwned();
    expect(summary.usersCleared).toBeGreaterThanOrEqual(1);

    const updatedUser = await User.collection.findOne({ _id: user._id });
    expect(updatedUser?.breederProfileId).toBeUndefined();

    const updatedBreeder = await Breeder.collection.findOne({ _id: breederId });
    expect(String(updatedBreeder?.mainOwnerUserId)).toBe(String(user._id));
  });

  it("does not write in dry run mode", async () => {
    const user = await userService.createCredentialsUser({
      email: "migrate-breeder-dry@example.com",
      password: "TestPass1!",
    });
    const legacyId = new mongoose.Types.ObjectId();

    await Breeder.collection.insertOne({
      _id: legacyId,
      userId: user._id,
      operationName: "Dry Breeder",
      description: "Dry",
      email: "dry@example.com",
      phoneNumber: "+351900000002",
      address: { country: "PT", city: "Lisbon", street: "C", postCode: "1000" },
    });

    await migrateBreederToEntityOwned({ dryRun: true });

    const unchanged = await Breeder.collection.findOne({ _id: legacyId });
    expect(unchanged?.userId).toBeDefined();
    expect(unchanged?.mainOwnerUserId).toBeUndefined();
  });

  it("backfills collaborators from active workplace relationships", async () => {
    const owner = await userService.createCredentialsUser({
      email: "migrate-breeder-collab@example.com",
      password: "TestPass1!",
    });
    const breeder = await Breeder.create({
      mainOwnerUserId: owner._id,
      operationName: "Collab Breeder",
      description: "Collab",
      email: "collab@example.com",
      phoneNumber: "+351900000003",
      address: { country: "PT", city: "Lisbon", street: "D", postCode: "1000" },
    });

    const collaboration = await WorkplaceRelationship.create({
      hostRoleType: "breeder",
      hostRoleProfileId: breeder._id,
      invitedEmail: "staff@example.com",
      hierarchyLevel: "staff",
      status: "active",
      active: true,
      invitedByUserId: owner._id,
      acceptedAt: new Date(),
    });

    const summary = await migrateBreederToEntityOwned();
    expect(summary.collaboratorsBackfilled).toBeGreaterThanOrEqual(1);

    const updated = await Breeder.findById(breeder._id).lean();
    expect(updated?.collaborators?.map(String)).toContain(String(collaboration._id));
  });
});
