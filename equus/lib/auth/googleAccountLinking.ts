/**
 * Google ↔ credentials account linking (UA-24).
 *
 * When Google OAuth returns an email that already belongs to an Equus user,
 * link `googleSubjectId` on that user instead of creating a duplicate.
 * Registration with the same email remains blocked.
 */

import User from "@/models/User.ts";
import { ApiError } from "@/lib/api/errors.ts";
import { isDocumentActive } from "@/lib/lifecycle/activeQuery.ts";
import { isUserPiiAnonymized } from "@/lib/lifecycle/anonymizeUserPii.ts";
import type { GoogleProfileInput } from "./types.ts";

/** True when the user can sign in with Google OAuth. */
export function userHasGoogleLink(doc: Record<string, unknown>): boolean {
  const googleSubjectId = doc.googleSubjectId;
  return typeof googleSubjectId === "string" && googleSubjectId.trim().length > 0;
}

/**
 * Attach Google identity to an existing user matched by email.
 * Preserves `authProvider` and password so credentials sign-in keeps working.
 */
export async function linkGoogleToExistingUser(
  userId: string,
  profile: GoogleProfileInput,
) {
  const user = await User.findById(userId);
  if (!user) {
    throw new ApiError(404, "User not found", "NOT_FOUND");
  }

  if (!isDocumentActive(user) || isUserPiiAnonymized(user)) {
    throw new ApiError(403, "Account is not active", "FORBIDDEN");
  }

  const existingSub =
    user.googleSubjectId != null ? String(user.googleSubjectId) : undefined;
  if (existingSub && existingSub !== profile.sub) {
    throw new ApiError(
      409,
      "This email is linked to a different Google account",
      "GOOGLE_ACCOUNT_MISMATCH",
    );
  }

  user.googleSubjectId = profile.sub;

  if (profile.emailVerified) {
    user.emailVerified = true;
  }

  if (profile.image && !user.personalDetails?.imageUrl) {
    user.personalDetails.imageUrl = profile.image;
  }

  await user.save();
  return user;
}
