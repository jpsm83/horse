import { describe, expect, it } from "vitest";
import mongoose from "mongoose";

import Stable from "@/models/Stable.ts";
import { renameHostEntityOwnerField } from "@/lib/migrations/renameHostEntityOwnerField.ts";
import { createTestStable } from "@/tests/helpers/businessRoleFixtures.ts";
import * as userService from "@/lib/services/userService.ts";

describe("renameHostEntityOwnerField", () => {
  it("renames userId to mainOwnerUserId on stables collection", async () => {
    const user = await userService.createCredentialsUser({
      email: "migrate-host@example.com",
      password: "TestPass1!",
    });
    const stable = await createTestStable(user._id);

    await Stable.collection.updateOne(
      { _id: stable._id },
      { $rename: { mainOwnerUserId: "userId" } },
    );

    const summary = await renameHostEntityOwnerField();
    expect(summary.stablesRenamed).toBeGreaterThanOrEqual(1);
    expect(summary.errors).toEqual([]);

    const updated = await Stable.collection.findOne({ _id: stable._id });
    expect(updated?.mainOwnerUserId).toBeDefined();
    expect(updated?.userId).toBeUndefined();
  });

  it("does not write in dry run mode", async () => {
    const user = await userService.createCredentialsUser({
      email: "migrate-dry-host@example.com",
      password: "TestPass1!",
    });
    const legacyId = new mongoose.Types.ObjectId();

    await Stable.collection.insertOne({
      userId: user._id,
      tradeName: "Legacy Stable",
      description: "Legacy",
      email: "legacy@example.com",
      phoneNumber: "+351900000000",
      address: { country: "PT", city: "Lisbon", street: "A", postCode: "1000" },
      _id: legacyId,
    });

    await renameHostEntityOwnerField({ dryRun: true });

    const unchanged = await Stable.collection.findOne({ _id: legacyId });
    expect(unchanged?.userId).toBeDefined();
    expect(unchanged?.mainOwnerUserId).toBeUndefined();
  });
});
