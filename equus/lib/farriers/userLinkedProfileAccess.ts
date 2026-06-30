/**
 * User-linked farrier profile ownership checks.
 *
 * Farriers use `Farrier.userId` + `User.farrierProfileId` (one profile per user).
 * Mirrors the intent of `entityOwnership` for user-linked role profiles.
 */

/** True when userId owns the farrier profile document. */
export function userOwnsFarrierProfile(
  userId: string,
  farrier: Record<string, unknown>,
): boolean {
  const profileUserId = farrier.userId;
  return profileUserId != null && String(profileUserId) === userId;
}
