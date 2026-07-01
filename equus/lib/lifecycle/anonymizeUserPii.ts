/**
 * User PII anonymization — regulatory erasure without deleting the User document.
 *
 * Keeps `_id` so horse documents, relationships, and audit refs stay valid.
 * Horse-attached records retain provider attribution via snapshots on those documents.
 *
 * Called by `userService.anonymizeUserPii`. Not exposed as a public self-service API yet.
 * See `equus/documentation/piiAnonymization.md`.
 */

import mongoose from "mongoose";
import User from "@/models/User.ts";
import { ApiError } from "@/lib/api/errors.ts";

export const ANONYMIZED_EMAIL_DOMAIN = "anonymized.equus";

export type AnonymizeUserPiiInput = {
  anonymizedByUserId: string;
  anonymizedAt?: Date;
};

function ensureObjectId(id: string, fieldName: string): void {
  if (!mongoose.Types.ObjectId.isValid(id)) {
    throw new ApiError(400, `Invalid ${fieldName}`, "VALIDATION_ERROR");
  }
}

/** Deterministic placeholder email — unique per user, not routable. */
export function buildAnonymizedEmail(userId: string): string {
  return `anonymized.${userId.toLowerCase()}@${ANONYMIZED_EMAIL_DOMAIN}`;
}

export function isUserPiiAnonymized(
  doc: { piiAnonymizedAt?: Date | null } | null | undefined,
): boolean {
  return doc?.piiAnonymizedAt instanceof Date && !Number.isNaN(doc.piiAnonymizedAt.getTime());
}

/** Mongo update operators that scrub personal PII while keeping the User row. */
export function buildUserPiiAnonymizationUpdate(
  userId: string,
  input: AnonymizeUserPiiInput,
): Record<string, unknown> {
  const anonymizedAt = input.anonymizedAt ?? new Date();

  return {
    $set: {
      isActive: false,
      "personalDetails.email": buildAnonymizedEmail(userId),
      "preferences.profileVisibility": "private",
      "preferences.allowDirectMessagesFrom": "nobody",
      piiAnonymizedAt: anonymizedAt,
      piiAnonymizedByUserId: input.anonymizedByUserId,
      emailVerified: false,
    },
    $unset: {
      "personalDetails.password": "",
      "personalDetails.username": "",
      "personalDetails.firstName": "",
      "personalDetails.lastName": "",
      "personalDetails.idType": "",
      "personalDetails.idNumber": "",
      "personalDetails.address": "",
      "personalDetails.nationality": "",
      "personalDetails.gender": "",
      "personalDetails.birthDate": "",
      "personalDetails.phoneNumber": "",
      "personalDetails.imageUrl": "",
      "personalDetails.bio": "",
      "personalDetails.preferredLanguage": "",
      googleSubjectId: "",
      verificationToken: "",
      resetPasswordToken: "",
      resetPasswordExpires: "",
      notifications: "",
    },
    $inc: { refreshSessionVersion: 1 },
  };
}

/**
 * Apply PII anonymization to an already-deactivated user.
 * Idempotent when `piiAnonymizedAt` is already set.
 */
export async function applyUserPiiAnonymization(
  userId: string,
  input: AnonymizeUserPiiInput,
): Promise<Record<string, unknown> | null> {
  ensureObjectId(userId, "user id");
  ensureObjectId(input.anonymizedByUserId, "anonymized by user id");

  const existing = await User.findById(userId)
    .select("isActive piiAnonymizedAt")
    .lean();

  if (!existing) {
    return null;
  }

  if (isUserPiiAnonymized(existing)) {
    const doc = await User.findById(userId)
      .select("-personalDetails.password -verificationToken -resetPasswordToken -resetPasswordExpires")
      .lean();
    return doc as Record<string, unknown> | null;
  }

  if (existing.isActive !== false) {
    throw new ApiError(
      400,
      "User must be deactivated before PII anonymization",
      "VALIDATION_ERROR",
    );
  }

  const updated = await User.findByIdAndUpdate(
    userId,
    buildUserPiiAnonymizationUpdate(userId, input),
    { returnDocument: "after", runValidators: true },
  )
    .select("-personalDetails.password -verificationToken -resetPasswordToken -resetPasswordExpires")
    .lean();

  if (!updated) {
    return null;
  }

  return updated as Record<string, unknown>;
}
