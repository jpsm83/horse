import { describe, expect, it } from "vitest";
import mongoose from "mongoose";

import Horse from "@/models/Horse.ts";
import User from "@/models/User.ts";
import {
  buildDeactivationSet,
  deactivateDocument,
  mergeDeactivationUpdate,
} from "@/lib/lifecycle/deactivateDocument.ts";
import * as userService from "@/lib/services/userService.ts";

describe("deactivateDocument", () => {
  it("buildDeactivationSet returns tombstone fields", () => {
    const actorId = new mongoose.Types.ObjectId().toString();
    const at = new Date("2026-06-30T12:00:00.000Z");

    expect(buildDeactivationSet({
      deactivatedByUserId: actorId,
      deactivatedAt: at,
      deactivationReason: "operator_request",
    })).toEqual({
      isActive: false,
      deactivatedAt: at,
      deactivatedByUserId: actorId,
      deactivationReason: "operator_request",
    });
  });

  it("mergeDeactivationUpdate deep-merges $set and preserves $inc", () => {
    const actorId = new mongoose.Types.ObjectId().toString();
    const at = new Date("2026-06-30T12:00:00.000Z");

    const update = mergeDeactivationUpdate(
      { deactivatedByUserId: actorId, deactivatedAt: at },
      { $inc: { refreshSessionVersion: 1 }, $set: { "personalDetails.bio": "cleared" } },
    );

    expect(update.$inc).toEqual({ refreshSessionVersion: 1 });
    expect(update.$set).toMatchObject({
      isActive: false,
      deactivatedAt: at,
      deactivatedByUserId: actorId,
      "personalDetails.bio": "cleared",
    });
  });

  it("deactivateDocument tombstones a horse", async () => {
    const owner = await userService.createCredentialsUser({
      email: "deactivate-horse@example.com",
      password: "TestPass1!",
    });

    const horse = await Horse.create({
      name: "Tombstone",
      breed: "Lusitano",
      sex: "Mare",
      mainOwnerUserId: owner._id,
      createdByUserId: owner._id,
    });

    const deactivated = await deactivateDocument(
      Horse,
      String(horse._id),
      {
        deactivatedByUserId: String(owner._id),
        deactivationReason: "retired",
      },
      { select: "name isActive deactivatedAt deactivatedByUserId deactivationReason" },
    );

    expect(deactivated?.isActive).toBe(false);
    expect(deactivated?.deactivationReason).toBe("retired");
    expect(String(deactivated?.deactivatedByUserId)).toBe(String(owner._id));
    expect(deactivated?.deactivatedAt).toBeInstanceOf(Date);
  });

  it("deactivateDocument returns null for missing document", async () => {
    const actorId = new mongoose.Types.ObjectId().toString();
    const result = await deactivateDocument(User, actorId, {
      deactivatedByUserId: actorId,
    });

    expect(result).toBeNull();
  });

  it("rejects invalid document id", async () => {
    await expect(
      deactivateDocument(User, "not-an-id", {
        deactivatedByUserId: new mongoose.Types.ObjectId().toString(),
      }),
    ).rejects.toMatchObject({ statusCode: 400 });
  });
});
