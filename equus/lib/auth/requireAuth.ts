/**
 * requireAuthFromRequest — access JWT verification for protected API routes.
 *
 * Verifies signature/expiry, then checks User.isActive in the database so
 * deactivated accounts cannot use a still-valid access token until expiry.
 */

import { ApiError } from "../api/errors.ts";
import { getAccessTokenFromRequest, verifyAccessToken } from "./jwt.ts";
import { assertUserAccountActive } from "./session.ts";
import { touchUserLastActiveAt } from "./touchUserLastActive.ts";
import type { AuthUser } from "./types.ts";

export type OptionalAuthRequester = {
  id?: string;
  isAuthenticated: boolean;
};

/**
 * Optional auth for public read routes — returns anonymous when token is missing,
 * invalid, or belongs to a deactivated account (UA-04).
 */
export async function readOptionalAuthFromRequest(
  request: Request,
): Promise<OptionalAuthRequester> {
  const token = getAccessTokenFromRequest(request);
  if (!token) {
    return { isAuthenticated: false };
  }

  try {
    const user = await verifyAccessToken(token);
    await assertUserAccountActive(user.id);
    return { id: user.id, isAuthenticated: true };
  } catch {
    return { isAuthenticated: false };
  }
}

export async function requireAuthFromRequest(request: Request): Promise<AuthUser> {
  const token = getAccessTokenFromRequest(request);

  if (!token) {
    throw new ApiError(401, "No access token provided", "UNAUTHORIZED");
  }

  let user: AuthUser;
  try {
    user = await verifyAccessToken(token);
  } catch {
    throw new ApiError(401, "Invalid or expired access token", "UNAUTHORIZED");
  }

  await assertUserAccountActive(user.id);
  touchUserLastActiveAt(user.id);
  return user;
}
