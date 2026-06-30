/**
 * User-linked trainer profile ownership checks.
 *
 * Trainers use `Trainer.userId` + `User.trainerProfileId` (one profile per user).
 * Mirrors the intent of `entityOwnership` for user-linked role profiles.
 */

/** True when userId owns the trainer profile document. */
export function userOwnsTrainerProfile(
  userId: string,
  trainer: Record<string, unknown>,
): boolean {
  const profileUserId = trainer.userId;
  return profileUserId != null && String(profileUserId) === userId;
}
