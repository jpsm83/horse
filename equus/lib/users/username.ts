/**
 * Username normalization and uniqueness — public profiles show `@username` (UA-23).
 *
 * Usernames are stored lowercase on `User.personalDetails.username` with a sparse
 * unique index. Called by `userService` on register and profile patch.
 */

import User from "@/models/User.ts";
import { ApiError } from "@/lib/api/errors.ts";

/** Trim and lowercase for case-insensitive uniqueness. */
export function normalizeUsername(username: string): string {
  return username.trim().toLowerCase();
}

export async function findUserIdByUsername(username: string): Promise<string | null> {
  const normalized = normalizeUsername(username);
  if (!normalized) {
    return null;
  }

  const user = await User.findOne({ "personalDetails.username": normalized })
    .select("_id")
    .lean();

  return user ? String(user._id) : null;
}

/** Throws 409 when another active user already owns the username. */
export async function assertUsernameAvailable(
  username: string,
  excludeUserId?: string,
): Promise<void> {
  const normalized = normalizeUsername(username);
  if (!normalized) {
    return;
  }

  const existingId = await findUserIdByUsername(normalized);
  if (existingId && existingId !== excludeUserId) {
    throw new ApiError(409, "Username is already taken", "CONFLICT", [
      { path: "username", message: "Username is already taken" },
    ]);
  }
}
