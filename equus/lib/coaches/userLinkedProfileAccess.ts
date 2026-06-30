/**
 * User-linked coach profile ownership checks.
 *
 * Coaches use `Coach.userId` + `User.coachProfileId` (one profile per user).
 * Mirrors the intent of `entityOwnership` for user-linked role profiles.
 */

/** True when userId owns the coach profile document. */
export function userOwnsCoachProfile(
  userId: string,
  coach: Record<string, unknown>,
): boolean {
  const profileUserId = coach.userId;
  return profileUserId != null && String(profileUserId) === userId;
}
