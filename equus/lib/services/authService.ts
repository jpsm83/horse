import bcrypt from "bcrypt";
import type { NextResponse } from "next/server";
import { ApiError } from "../api/errors.ts";
import User from "../../models/User.ts";
import {
  signAccessToken,
  signRefreshToken,
  verifyRefreshToken,
  setRefreshCookie,
  clearRefreshCookie,
} from "../auth/jwt.ts";
import {
  buildAuthUserSessionFromUserId,
  readRefreshSessionVersionForUser,
  refreshTokenPayloadVersionMatchesDb,
} from "../auth/session.ts";
import { handleRequestEmailConfirmation } from "../auth/requestEmailConfirmation.ts";
import type { AuthUser } from "../auth/types.ts";
import * as userService from "./userService.ts";

export type AuthTokensResult = {
  accessToken: string;
  refreshToken: string;
  user: AuthUser;
};

async function issueTokens(
  session: AuthUser,
  refreshSessionVersion: number,
  response?: NextResponse,
): Promise<AuthTokensResult> {
  const accessToken = await signAccessToken(session);
  const refreshToken = await signRefreshToken({
    id: session.id,
    type: "user",
    v: refreshSessionVersion,
  });

  if (response) {
    setRefreshCookie(response, refreshToken);
  }

  return { accessToken, refreshToken, user: session };
}

export async function buildSessionForUserId(userId: string): Promise<AuthUser> {
  const session = await buildAuthUserSessionFromUserId(userId);
  if (!session) {
    throw new ApiError(401, "User not found", "UNAUTHORIZED");
  }
  return session;
}

export async function getSessionFromAccessToken(token: string): Promise<AuthUser> {
  const { verifyAccessToken } = await import("../auth/jwt.ts");
  return verifyAccessToken(token);
}

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

  return {
    ...session,
    refreshSessionVersion: user.refreshSessionVersion ?? 0,
  };
}

export async function register(
  input: {
    email: string;
    password: string;
    username?: string;
    firstName?: string;
    lastName?: string;
  },
  response?: NextResponse,
) {
  const normalizedEmail = input.email.toLowerCase().trim();
  const existing = await userService.findByEmail(normalizedEmail);
  if (existing) {
    throw new ApiError(409, "Account with this email already exists", "CONFLICT");
  }

  const createdUser = await userService.createMinimalUser(input);
  const session = await buildAuthUserSessionFromUserId(String(createdUser._id));
  if (!session) {
    throw new ApiError(500, "Failed to create session", "INTERNAL_ERROR");
  }

  const tokens = await issueTokens(session, createdUser.refreshSessionVersion ?? 0, response);

  handleRequestEmailConfirmation(normalizedEmail).catch(() => undefined);

  return tokens;
}

export async function login(email: string, password: string, response?: NextResponse) {
  const result = await validateCredentials(email, password);
  if (!result) {
    throw new ApiError(401, "Invalid credentials", "UNAUTHORIZED");
  }

  const { refreshSessionVersion, ...session } = result;
  return issueTokens(session, refreshSessionVersion ?? 0, response);
}

export async function refresh(refreshToken: string, response?: NextResponse) {
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

  const session = await buildAuthUserSessionFromUserId(payload.id);
  if (!session) {
    throw new ApiError(401, "User not found", "UNAUTHORIZED");
  }

  const accessToken = await signAccessToken(session);
  const newRefresh = await signRefreshToken({ id: session.id, type: "user", v: dbVersion });
  if (response) {
    setRefreshCookie(response, newRefresh);
  }
  return { accessToken, refreshToken: newRefresh, user: session };
}

export function logout(response: NextResponse) {
  clearRefreshCookie(response);
}

