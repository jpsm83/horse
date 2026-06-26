import type { NextResponse } from "next/server";

import { ApiError } from "../api/errors.ts";
import { setAuthCookies, signAccessToken, signRefreshToken } from "./jwt.ts";
import {
  buildAuthUserSessionFromUserId,
  readRefreshSessionVersionForUser,
} from "./session.ts";
import type { AuthUser } from "./types.ts";

export type SessionTokens = {
  accessToken: string;
  refreshToken: string;
  user: AuthUser;
};

export async function establishSession(userId: string): Promise<SessionTokens> {
  const user = await buildAuthUserSessionFromUserId(userId);
  if (!user) {
    throw new ApiError(401, "User not found", "UNAUTHORIZED");
  }

  const refreshSessionVersion = await readRefreshSessionVersionForUser(userId);
  if (refreshSessionVersion === null) {
    throw new ApiError(401, "User not found", "UNAUTHORIZED");
  }

  const accessToken = await signAccessToken(user);
  const refreshToken = await signRefreshToken({
    id: user.id,
    type: "user",
    v: refreshSessionVersion,
  });

  return { accessToken, refreshToken, user };
}

export function attachSessionCookies(
  response: NextResponse,
  tokens: SessionTokens,
): void {
  setAuthCookies(response, tokens.accessToken, tokens.refreshToken);
}
