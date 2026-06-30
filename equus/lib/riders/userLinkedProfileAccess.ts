/**
 * User-linked rider profile ownership checks.
 *
 * Riders use `Rider.userId` + `User.riderProfileId` (one profile per user).
 * Mirrors the intent of `entityOwnership` for user-linked role profiles.
 */

/** True when userId owns the rider profile document. */
export function userOwnsRiderProfile(
  userId: string,
  rider: Record<string, unknown>,
): boolean {
  const profileUserId = rider.userId;
  return profileUserId != null && String(profileUserId) === userId;
}
