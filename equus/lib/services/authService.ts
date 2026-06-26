/**
 * Auth service — authentication use cases (login, register, refresh, logout).
 *
 * Called by:
 * - REST routes under `app/api/v1/auth/*` (login, register, refresh, logout)
 * - NextAuth callbacks in `lib/auth/auth.ts` (validateCredentials, buildSessionForUserId)
 *
 * Does not set HTTP cookies here. Route handlers call `establishSession` then
 * `attachSessionCookies` on the response. Token signing lives in `lib/auth/establishSession.ts`.
 */

import bcrypt from "bcrypt";
import type { NextResponse } from "next/server";
import { ApiError } from "../api/errors.ts";
import User from "../../models/User.ts";
import { verifyRefreshToken, clearAuthCookies } from "../auth/jwt.ts";
import { establishSession, type SessionTokens } from "../auth/establishSession.ts";
import {
  buildAuthUserSessionFromUserId,
  readRefreshSessionVersionForUser,
  refreshTokenPayloadVersionMatchesDb,
} from "../auth/session.ts";
import { handleRequestEmailConfirmation } from "../auth/requestEmailConfirmation.ts";
import type { AuthUser } from "../auth/types.ts";
import * as userService from "./userService.ts";

export type AuthTokensResult = SessionTokens;

// --- Session helpers (used by NextAuth and token verification) ---

/** Load the JWT/session payload for a user id; throws if the user is missing or inactive. */
export async function buildSessionForUserId(userId: string): Promise<AuthUser> {
  const session = await buildAuthUserSessionFromUserId(userId);
  if (!session) {
    throw new ApiError(401, "User not found", "UNAUTHORIZED");
  }
  return session;
}

/** Decode and validate an access JWT string into an AuthUser. */
export async function getSessionFromAccessToken(token: string): Promise<AuthUser> {
  const { verifyAccessToken } = await import("../auth/jwt.ts");
  return verifyAccessToken(token);
}

// --- Credential validation (email + password) ---

/**
 * Check email/password against the database.
 * Returns the auth user on success, or `null` if credentials are wrong or the account cannot sign in.
 * Updates `lastLoginAt` on success.
 */
export async function validateCredentials(email: string, password: string) {
  const normalizedEmail = email.toLowerCase().trim();
  const user = await User.findOne({ "personalDetails.email": normalizedEmail })
    .select(
      "_id personalDetails.email personalDetails.password personalDetails.emailVerified emailVerified refreshSessionVersion isActive authProvider",
    )
    .lean();

  if (!user || user.isActive === false || !user.personalDetails?.password) {
    return null;
  }

  const passwordMatch = await bcrypt.compare(password, user.personalDetails.password);
  if (!passwordMatch) {
    return null;
  }

  const session = await buildAuthUserSessionFromUserId(String(user._id));
  if (!session) return null;

  await User.updateOne({ _id: user._id }, { $set: { lastLoginAt: new Date() } });

  return session;
}

// --- Public auth flows (REST API) ---

/** Create a new credentials user, issue tokens, and queue the confirmation email. */
export async function register(input: {
  email: string;
  password: string;
  username?: string;
  firstName?: string;
  lastName?: string;
}) {
  const normalizedEmail = input.email.toLowerCase().trim();
  const existing = await userService.findByEmail(normalizedEmail);
  if (existing) {
    throw new ApiError(409, "Account with this email already exists", "CONFLICT");
  }

  const createdUser = await userService.createMinimalUser(input);
  const tokens = await establishSession(String(createdUser._id));

  // Fire-and-forget; registration should not fail if email delivery fails.
  handleRequestEmailConfirmation(normalizedEmail).catch(() => undefined);

  return tokens;
}

/** Validate credentials and issue a new access + refresh token pair. */
export async function login(email: string, password: string) {
  const session = await validateCredentials(email, password);
  if (!session) {
    throw new ApiError(401, "Invalid credentials", "UNAUTHORIZED");
  }

  return establishSession(session.id);
}

/**
 * Validate a refresh token and issue new tokens.
 * Rejects tokens whose version no longer matches the DB (e.g. after password reset).
 */
export async function refresh(refreshToken: string) {
  let payload;
  try {
    payload = await verifyRefreshToken(refreshToken);
  } catch {
    throw new ApiError(401, "Invalid or expired refresh token", "UNAUTHORIZED");
  }

  const dbVersion = await readRefreshSessionVersionForUser(payload.id);
  if (dbVersion === null) {
    throw new ApiError(401, "User not found", "UNAUTHORIZED");
  }

  if (!refreshTokenPayloadVersionMatchesDb(payload.v, dbVersion)) {
    throw new ApiError(401, "Invalid or expired refresh token", "UNAUTHORIZED");
  }

  return establishSession(payload.id);
}

/** Clear httpOnly auth cookies on the response. */
export function logout(response: NextResponse) {
  clearAuthCookies(response);
}
