/**
 * Auth session helpers — JWT/session payload building and profile completion checks.
 *
 * Called by:
 * - `authService` and `lib/auth/jwt.ts` (session payload for access tokens)
 * - `userService.toPublicUser` (`profileComplete` on API responses)
 * - NextAuth callbacks in `lib/auth/auth.ts`
 */

import User from "../../models/User.ts";
import type { AuthProvider, AuthUser } from "./types.ts";

/**
 * Personal-details fields that must be filled for `profileComplete`.
 * Align with `models/PersonalDetails.ts` (excludes auth-only: password, emailVerified).
 */
const PERSONAL_DETAILS_PROFILE_FIELDS = [
  "username",
  "email",
  "firstName",
  "lastName",
  "idType",
  "idNumber",
  "nationality",
  "gender",
  "phoneNumber",
  "imageUrl",
  "bio",
  "preferredLanguage",
  "timezone",
] as const;

/** Address subfields that must be filled when checking `profileComplete`. Align with `models/sharedSchemas/address.ts`. */
const ADDRESS_PROFILE_FIELDS = [
  "country",
  "state",
  "city",
  "street",
  "buildingNumber",
  "doorNumber",
  "complement",
  "postCode",
  "region",
  "additionalDetails",
] as const;

// --- Profile completion ---

/**
 * True when every profile field on `personalDetails` and `personalDetails.address` is set.
 * Auth-only fields (password, emailVerified) are excluded.
 */
export function isProfileComplete(
  personalDetails: Record<string, unknown> | null | undefined,
): boolean {
  if (!personalDetails) return false;

  for (const field of PERSONAL_DETAILS_PROFILE_FIELDS) {
    if (!hasNonEmptyString(personalDetails[field])) {
      return false;
    }
  }

  const birthDate = personalDetails.birthDate;
  if (!(birthDate instanceof Date) || Number.isNaN(birthDate.getTime())) {
    return false;
  }

  const address = personalDetails.address as Record<string, unknown> | undefined;
  if (!address) return false;

  for (const field of ADDRESS_PROFILE_FIELDS) {
    if (!hasNonEmptyString(address[field])) {
      return false;
    }
  }

  if (!hasValidCoordinates(address.coordinates)) {
    return false;
  }

  return true;
}

function hasNonEmptyString(value: unknown): boolean {
  return typeof value === "string" && value.trim().length > 0;
}

function hasValidCoordinates(value: unknown): boolean {
  return (
    Array.isArray(value) &&
    value.length === 2 &&
    typeof value[0] === "number" &&
    typeof value[1] === "number" &&
    !Number.isNaN(value[0]) &&
    !Number.isNaN(value[1])
  );
}

// --- Refresh token versioning ---

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

// --- Session payload ---

/** Build the `AuthUser` shape stored in access tokens and returned by `/auth/me`. */
export async function buildAuthUserSessionFromUserId(userId: string): Promise<AuthUser | null> {
  const user = await User.findById(userId)
    .select(
      "-personalDetails.password -verificationToken -resetPasswordToken -resetPasswordExpires",
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
    profileComplete: isProfileComplete(
      user.personalDetails as Record<string, unknown> | undefined,
    ),
    preferredLanguage:
      typeof user.personalDetails?.preferredLanguage === "string"
        ? user.personalDetails.preferredLanguage
        : undefined,
  };
}
