import User from "../../models/User.ts";
import type { AuthProvider, AuthUser } from "./types.ts";

export function isProfileComplete(personalDetails: {
  address?: { country?: string };
} | null | undefined): boolean {
  const country = personalDetails?.address?.country?.trim();
  if (!country) return false;
  return country !== "Unknown";
}

export async function readRefreshSessionVersionForUser(userId: string): Promise<number | null> {
  const doc = (await User.findById(userId).select("refreshSessionVersion").lean()) as {
    refreshSessionVersion?: number;
  } | null;
  if (!doc) return null;
  return doc.refreshSessionVersion ?? 0;
}

export function refreshTokenPayloadVersionMatchesDb(
  tokenVersion: number | undefined,
  dbVersion: number,
): boolean {
  return (tokenVersion ?? 0) === dbVersion;
}

export async function buildAuthUserSessionFromUserId(userId: string): Promise<AuthUser | null> {
  const user = await User.findById(userId)
    .select(
      "personalDetails.email personalDetails.emailVerified personalDetails.address emailVerified authProvider isActive",
    )
    .lean();

  if (!user || user.isActive === false) return null;

  const email =
    typeof user.personalDetails?.email === "string"
      ? user.personalDetails.email
      : String(user.personalDetails?.email ?? "");

  return {
    id: String(user._id),
    email,
    type: "user",
    emailVerified:
      user.personalDetails?.emailVerified === true || user.emailVerified === true,
    authProvider: (user.authProvider as AuthProvider | undefined) ?? "credentials",
    profileComplete: isProfileComplete(user.personalDetails),
  };
}
