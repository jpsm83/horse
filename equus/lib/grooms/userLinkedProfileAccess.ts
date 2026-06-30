/**
 * User-linked groom profile ownership checks.
 *
 * Grooms use `Groom.userId` + `User.groomProfileId` (one profile per user).
 */

/** True when userId owns the groom profile document. */
export function userOwnsGroomProfile(userId: string, groom: Record<string, unknown>): boolean {
  const profileUserId = groom.userId;
  return profileUserId != null && String(profileUserId) === userId;
}
