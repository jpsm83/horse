import { SignJWT, jwtVerify } from "jose";
import type { NextResponse } from "next/server";
import { AUTH_CONFIG } from "./config.ts";
import type { AuthUser, RefreshTokenPayload } from "./types.ts";

function getAccessSecret() {
  return new TextEncoder().encode(AUTH_CONFIG.JWT_SECRET);
}

function getRefreshSecret() {
  return new TextEncoder().encode(AUTH_CONFIG.REFRESH_SECRET);
}

export async function signAccessToken(session: AuthUser): Promise<string> {
  return new SignJWT({ ...session })
    .setProtectedHeader({ alg: "HS256" })
    .setExpirationTime(AUTH_CONFIG.ACCESS_TOKEN_EXPIRES_IN)
    .sign(getAccessSecret());
}

export async function signRefreshToken(payload: RefreshTokenPayload): Promise<string> {
  return new SignJWT({ ...payload })
    .setProtectedHeader({ alg: "HS256" })
    .setExpirationTime(AUTH_CONFIG.REFRESH_TOKEN_EXPIRES_IN)
    .sign(getRefreshSecret());
}

export async function verifyAccessToken(token: string): Promise<AuthUser> {
  const { payload } = await jwtVerify(token, getAccessSecret());
  return payload as unknown as AuthUser;
}

export async function verifyRefreshToken(token: string): Promise<RefreshTokenPayload> {
  const { payload } = await jwtVerify(token, getRefreshSecret());
  return payload as unknown as RefreshTokenPayload;
}

export function setRefreshCookie(response: NextResponse, refreshToken: string) {
  response.cookies.set(AUTH_CONFIG.REFRESH_COOKIE_NAME, refreshToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: AUTH_CONFIG.COOKIE_MAX_AGE_SECONDS,
  });
}

export function clearRefreshCookie(response: NextResponse) {
  response.cookies.set(AUTH_CONFIG.REFRESH_COOKIE_NAME, "", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 0,
  });
}
