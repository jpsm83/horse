import { describe, expect, it, vi } from "vitest";
import mongoose from "mongoose";

import User from "@/models/User.ts";
import { ApiError } from "@/lib/api/errors.ts";
import {
  ANONYMIZED_EMAIL_DOMAIN,
  applyUserPiiAnonymization,
  buildAnonymizedEmail,
  buildUserPiiAnonymizationUpdate,
  isUserPiiAnonymized,
} from "@/lib/lifecycle/anonymizeUserPii.ts";
import * as userService from "@/lib/services/userService.ts";

vi.mock("@/lib/cloudinary/deleteFilesCloudinary.ts", () => ({
  default: vi.fn().mockResolvedValue(true),
}));

async function createUser(email: string) {
  return userService.createCredentialsUser({
    email,
    password: "TestPass1!",
    firstName: "PII",
    lastName: "Subject",
  });
}

describe("anonymizeUserPii", () => {
  it("buildAnonymizedEmail is unique and uses anonymized domain", () => {
    const userId = new mongoose.Types.ObjectId().toString();
    expect(buildAnonymizedEmail(userId)).toBe(`anonymized.${userId}@${ANONYMIZED_EMAIL_DOMAIN}`);
  });

  it("buildUserPiiAnonymizationUpdate unsets personal fields and sets placeholder email", () => {
    const userId = new mongoose.Types.ObjectId().toString();
    const actorId = new mongoose.Types.ObjectId().toString();
    const at = new Date("2026-06-30T12:00:00.000Z");

    const update = buildUserPiiAnonymizationUpdate(userId, {
      anonymizedByUserId: actorId,
      anonymizedAt: at,
    });

    expect(update.$set).toMatchObject({
      isActive: false,
      "personalDetails.email": buildAnonymizedEmail(userId),
      "preferences.profileVisibility": "private",
      piiAnonymizedAt: at,
      piiAnonymizedByUserId: actorId,
    });
    expect(update.$unset).toHaveProperty("personalDetails.firstName");
    expect(update.$unset).toHaveProperty("googleSubjectId");
    expect(update.$inc).toEqual({ refreshSessionVersion: 1 });
  });

  it("rejects anonymization when user is still active", async () => {
    const created = await createUser("pii-active@example.com");

    await expect(
      applyUserPiiAnonymization(String(created._id), {
        anonymizedByUserId: String(created._id),
      }),
    ).rejects.toBeInstanceOf(ApiError);
  });

  it("scrubs PII after softDelete and keeps user id", async () => {
    const created = await createUser("pii-scrub@example.com");
    const userId = String(created._id);

    await userService.softDelete(userId);

    const result = await userService.anonymizeUserPii(userId, {
      anonymizedByUserId: userId,
    });

    expect(result?.id).toBe(userId);
    expect(result?.personalDetails.email).toBe(buildAnonymizedEmail(userId));
    expect(result?.personalDetails.firstName).toBeUndefined();
    expect(result?.personalDetails.phoneNumber).toBeUndefined();
    expect(result?.preferences.profileVisibility).toBe("private");
    expect(result?.preferences.allowDirectMessagesFrom).toBe("nobody");
    expect(result?.isActive).toBe(false);

    const reloaded = await User.findById(userId).lean();
    expect(isUserPiiAnonymized(reloaded)).toBe(true);
    expect(reloaded?.googleSubjectId).toBeUndefined();
  });

  it("is idempotent on second anonymize call", async () => {
    const created = await createUser("pii-idempotent@example.com");
    const userId = String(created._id);

    await userService.softDelete(userId);
    await userService.anonymizeUserPii(userId, { anonymizedByUserId: userId });

    const versionAfterFirst = (await User.findById(userId).select("refreshSessionVersion").lean())
      ?.refreshSessionVersion;

    await userService.anonymizeUserPii(userId, { anonymizedByUserId: userId });

    const versionAfterSecond = (await User.findById(userId).select("refreshSessionVersion").lean())
      ?.refreshSessionVersion;

    expect(versionAfterSecond).toBe(versionAfterFirst);
  });
});
