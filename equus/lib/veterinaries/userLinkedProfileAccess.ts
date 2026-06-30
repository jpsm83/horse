/**
 * User-linked veterinary profile ownership checks.
 *
 * Veterinary profiles use `Veterinary.userId` + `User.veterinaryProfileId` (one per user).
 * Mirrors the intent of `entityOwnership` for user-linked role profiles.
 */

/** True when userId owns the veterinary profile document. */
export function userOwnsVeterinaryProfile(
  userId: string,
  veterinary: Record<string, unknown>,
): boolean {
  const profileUserId = veterinary.userId;
  return profileUserId != null && String(profileUserId) === userId;
}
