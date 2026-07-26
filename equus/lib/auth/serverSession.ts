/**
 * serverSession — server-side auth helpers for RSC (Server Components, layouts).
 *
 * Reads the access token from the httpOnly cookie store via next/headers.
 * When the access token is missing/expired, falls back to a valid refresh cookie
 * to resolve the user id (read-only — does not set cookies from RSC).
 */

import { cookies } from "next/headers";
import { verifyAccessToken, verifyRefreshToken } from "./jwt.ts";
import {
  assertUserAccountActive,
  readRefreshSessionVersionForUser,
  refreshTokenPayloadVersionMatchesDb,
} from "./session.ts";
import { AUTH_CONFIG } from "./config.ts";

/**
 * Resolve the authenticated user id from request cookies in an RSC context.
 *
 * Order:
 * 1. Valid access token
 * 2. Valid refresh token (access may be expired — common on tab navigations)
 *
 * Returns null when the user is not signed in or both tokens are invalid.
 * Does not rotate cookies (RSC cannot set cookies); the client refresh path
 * still updates access_token on the next API call.
 */
export async function getServerUserId(): Promise<string | null> {
  try {
    const cookieStore = await cookies();

    const accessToken = cookieStore.get(AUTH_CONFIG.ACCESS_COOKIE_NAME)?.value;
    if (accessToken) {
      try {
        const user = await verifyAccessToken(accessToken);
        await assertUserAccountActive(user.id);
        return user.id;
      } catch {
        // Access expired/invalid — try refresh identity below.
      }
    }

    const refreshToken = cookieStore.get(AUTH_CONFIG.REFRESH_COOKIE_NAME)?.value;
    if (!refreshToken) return null;

    try {
      const payload = await verifyRefreshToken(refreshToken);
      const dbVersion = await readRefreshSessionVersionForUser(payload.id);
      if (dbVersion === null) return null;
      if (!refreshTokenPayloadVersionMatchesDb(payload.v, dbVersion)) return null;
      await assertUserAccountActive(payload.id);
      return payload.id;
    } catch {
      return null;
    }
  } catch {
    return null;
  }
}

/** True when a refresh cookie is present (session may still be recoverable). */
export async function hasRefreshCookie(): Promise<boolean> {
  try {
    const cookieStore = await cookies();
    return Boolean(cookieStore.get(AUTH_CONFIG.REFRESH_COOKIE_NAME)?.value);
  } catch {
    return false;
  }
}
