/**
 * JWT and auth cookie primitives for the REST API.
 *
 * Called by:
 * - `lib/auth/establishSession.ts` (sign tokens, attach cookies)
 * - `lib/auth/requireAuth.ts` (read + verify access token on incoming requests)
 * - `lib/services/authService.ts` (verify refresh token, clear cookies on logout)
 *
 * This is not NextAuth's session JWT. NextAuth manages its own cookie separately.
 * Secrets and cookie names come from `lib/auth/config.ts` (AUTH_CONFIG).
 */

import { SignJWT, jwtVerify } from "jose";
import type { NextResponse } from "next/server";
import { AUTH_CONFIG } from "./config.ts";
import type { AuthUser, RefreshTokenPayload } from "./types.ts";

// --- Signing keys ---

function getAccessSecret() {
  return new TextEncoder().encode(AUTH_CONFIG.SECRET);
}

function getRefreshSecret() {
  return new TextEncoder().encode(AUTH_CONFIG.REFRESH_SECRET);
}

// --- Token sign / verify (jose) ---

/** Create a short-lived access JWT carrying the AuthUser claims. */
export async function signAccessToken(session: AuthUser): Promise<string> {
  return new SignJWT({ ...session })
    .setProtectedHeader({ alg: "HS256" })
    .setExpirationTime(AUTH_CONFIG.ACCESS_TOKEN_EXPIRES_IN)
    .sign(getAccessSecret());
}

/** Create a long-lived refresh JWT (user id + session version for revocation). */
export async function signRefreshToken(payload: RefreshTokenPayload): Promise<string> {
  return new SignJWT({ ...payload })
    .setProtectedHeader({ alg: "HS256" })
    .setExpirationTime(AUTH_CONFIG.REFRESH_TOKEN_EXPIRES_IN)
    .sign(getRefreshSecret());
}

/** Validate an access JWT and return the embedded AuthUser. Throws if invalid or expired. */
export async function verifyAccessToken(token: string): Promise<AuthUser> {
  const { payload } = await jwtVerify(token, getAccessSecret());
  return payload as unknown as AuthUser;
}

/** Validate a refresh JWT. Throws if invalid or expired. */
export async function verifyRefreshToken(token: string): Promise<RefreshTokenPayload> {
  const { payload } = await jwtVerify(token, getRefreshSecret());
  return payload as unknown as RefreshTokenPayload;
}

// --- httpOnly cookies (web clients) ---

const cookieOptions = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "lax" as const,
  path: "/",
};

export function setAccessCookie(response: NextResponse, accessToken: string) {
  response.cookies.set(AUTH_CONFIG.ACCESS_COOKIE_NAME, accessToken, {
    ...cookieOptions,
    maxAge: AUTH_CONFIG.ACCESS_COOKIE_MAX_AGE_SECONDS,
  });
}

export function setRefreshCookie(response: NextResponse, refreshToken: string) {
  response.cookies.set(AUTH_CONFIG.REFRESH_COOKIE_NAME, refreshToken, {
    ...cookieOptions,
    maxAge: AUTH_CONFIG.COOKIE_MAX_AGE_SECONDS,
  });
}

/** Set both API auth cookies after login, register, refresh, or session sync. */
export function setAuthCookies(
  response: NextResponse,
  accessToken: string,
  refreshToken: string,
) {
  setAccessCookie(response, accessToken);
  setRefreshCookie(response, refreshToken);
}

export function clearAccessCookie(response: NextResponse) {
  response.cookies.set(AUTH_CONFIG.ACCESS_COOKIE_NAME, "", {
    ...cookieOptions,
    maxAge: 0,
  });
}

export function clearRefreshCookie(response: NextResponse) {
  response.cookies.set(AUTH_CONFIG.REFRESH_COOKIE_NAME, "", {
    ...cookieOptions,
    maxAge: 0,
  });
}

/** Remove both API auth cookies on logout. */
export function clearAuthCookies(response: NextResponse) {
  clearAccessCookie(response);
  clearRefreshCookie(response);
}

// --- Read token from incoming requests ---

function parseCookies(cookieHeader: string | null): Record<string, string> {
  if (!cookieHeader) return {};

  return Object.fromEntries(
    cookieHeader.split(";").map((part) => {
      const [key, ...rest] = part.trim().split("=");
      return [key, decodeURIComponent(rest.join("="))];
    }),
  );
}

/**
 * Extract the access token for API auth.
 * Mobile/API clients send `Authorization: Bearer`; the web app uses the httpOnly cookie.
 */
export function getAccessTokenFromRequest(request: Request): string | null {
  const authHeader = request.headers.get("authorization");
  if (authHeader?.startsWith("Bearer ")) {
    return authHeader.slice(7);
  }

  const cookies = parseCookies(request.headers.get("cookie"));
  return cookies[AUTH_CONFIG.ACCESS_COOKIE_NAME] ?? null;
}
