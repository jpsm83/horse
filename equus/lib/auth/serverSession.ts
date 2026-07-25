/**
 * serverSession — server-side auth helpers for RSC (Server Components, layouts).
 *
 * Reads the access token from the httpOnly cookie store via next/headers.
 * Falls back to null when no token is present or the token is expired/invalid.
 */

import { cookies } from "next/headers";
import { verifyAccessToken } from "./jwt.ts";
import { assertUserAccountActive } from "./session.ts";
import { AUTH_CONFIG } from "./config.ts";

/**
 * Read the authenticated user id from the request cookies in an RSC context.
 * Returns null when the user is not signed in or the token is invalid.
 */
export async function getServerUserId(): Promise<string | null> {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get(AUTH_CONFIG.ACCESS_COOKIE_NAME)?.value;
    if (!token) return null;
    const user = await verifyAccessToken(token);
    await assertUserAccountActive(user.id);
    return user.id;
  } catch {
    return null;
  }
}
