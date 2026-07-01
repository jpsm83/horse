/**
 * Throttled `User.lastActiveAt` updates for authenticated API traffic (UA-25).
 *
 * Called from `requireAuthFromRequest` after JWT + isActive checks. Writes are
 * fire-and-forget and skipped when the user was touched recently.
 */

import User from "@/models/User.ts";

/** Minimum gap between persisted `lastActiveAt` writes per user. */
export const LAST_ACTIVE_TOUCH_INTERVAL_MS = 5 * 60 * 1000;

/**
 * Bump `lastActiveAt` when stale. Does not block the caller; errors are ignored.
 */
export function touchUserLastActiveAt(userId: string): void {
  const cutoff = new Date(Date.now() - LAST_ACTIVE_TOUCH_INTERVAL_MS);

  void User.updateOne(
    {
      _id: userId,
      $or: [
        { lastActiveAt: { $exists: false } },
        { lastActiveAt: null },
        { lastActiveAt: { $lt: cutoff } },
      ],
    },
    { $set: { lastActiveAt: new Date() } },
  ).catch(() => undefined);
}
