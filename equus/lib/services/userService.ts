/**
 * User service — user persistence and profile operations.
 *
 * Called by:
 * - `authService` (register, duplicate-email checks)
 * - NextAuth Google flow in `lib/auth/auth.ts` (findOrCreateFromGoogle)
 * - REST routes under `app/api/v1/users/me/*`
 *
 * Account creation sets only provider-specific data (no placeholder profile values).
 * Profile fields are completed later via `updatePersonalDetails` + Zod sanitization.
 */

import bcrypt from "bcrypt";
import User from "../../models/User.ts";
import { normalizeLocale, type AppLocale } from "@/i18n/resolveLocale.ts";
import { isProfileComplete } from "../auth/session.ts";
import type { AuthProvider, GoogleProfileInput } from "../auth/types.ts";
import uploadFilesCloudinary from "../cloudinary/uploadFilesCloudinary.ts";
import deleteFilesCloudinary from "../cloudinary/deleteFilesCloudinary.ts";
import {
  assertCloudinaryDeleteSuccess,
  assertCloudinaryUploadUrls,
} from "../cloudinary/assertUpload.ts";
import {
  userDirectMessageAudienceEnums,
  userProfileVisibilityEnums,
} from "@/utils/enums.ts";
import type { UploadInputFile } from "../cloudinary/types.ts";
import type { z } from "zod";
import type { updatePersonalDetailsSchema } from "../validations/user.ts";
import { linkInvitesByEmail } from "./workplaceRelationshipService.ts";
import { linkRelationshipByReferral } from "./relationshipService.ts";

export type UpdatePersonalDetailsInput = z.infer<typeof updatePersonalDetailsSchema>;

export type PublicUserPreferences = {
  profileVisibility: (typeof userProfileVisibilityEnums)[number];
  allowDirectMessagesFrom: (typeof userDirectMessageAudienceEnums)[number];
};

const DEFAULT_PUBLIC_USER_PREFERENCES: PublicUserPreferences = {
  profileVisibility: "public",
  allowDirectMessagesFrom: "everyone",
};

/** Safe user shape returned by the API (password and tokens stripped). */
export type PublicUser = {
  id: string;
  personalDetails: Record<string, unknown>;
  preferences: PublicUserPreferences;
  emailVerified: boolean;
  authProvider: AuthProvider;
  profileComplete: boolean;
  hasPassword: boolean;
  isActive: boolean;
  createdAt?: Date;
  updatedAt?: Date;
  lastLoginAt?: Date;
  lastActiveAt?: Date;
};

// --- Internal helpers ---

/** Split a display name from Google into first/last when present. */
function splitNameIfPresent(name?: string | null): { firstName?: string; lastName?: string } {
  const trimmed = name?.trim();
  if (!trimmed) {
    return {};
  }

  const parts = trimmed.split(/\s+/);
  const firstName = parts[0];
  const lastName = parts.slice(1).join(" ");

  return {
    ...(firstName ? { firstName } : {}),
    ...(lastName ? { lastName } : {}),
  };
}

// --- API mapping ---

function omitNullishFields(details: Record<string, unknown>): Record<string, unknown> {
  for (const [key, value] of Object.entries(details)) {
    if (value == null) {
      delete details[key];
    }
  }
  return details;
}

function toPublicUserPreferences(doc: Record<string, unknown>): PublicUserPreferences {
  const preferences = (doc.preferences ?? {}) as Record<string, unknown>;

  const profileVisibility =
    typeof preferences.profileVisibility === "string" &&
    (userProfileVisibilityEnums as readonly string[]).includes(preferences.profileVisibility)
      ? (preferences.profileVisibility as PublicUserPreferences["profileVisibility"])
      : DEFAULT_PUBLIC_USER_PREFERENCES.profileVisibility;

  const allowDirectMessagesFrom =
    typeof preferences.allowDirectMessagesFrom === "string" &&
    (userDirectMessageAudienceEnums as readonly string[]).includes(
      preferences.allowDirectMessagesFrom,
    )
      ? (preferences.allowDirectMessagesFrom as PublicUserPreferences["allowDirectMessagesFrom"])
      : DEFAULT_PUBLIC_USER_PREFERENCES.allowDirectMessagesFrom;

  return {
    profileVisibility,
    allowDirectMessagesFrom,
  };
}

/** Whether the user document has a stored password hash (never expose the hash). */
export function userHasPassword(doc: Record<string, unknown>): boolean {
  const personalDetails = doc.personalDetails as Record<string, unknown> | undefined;
  const password = personalDetails?.password;
  return typeof password === "string" && password.length > 0;
}

/** Map a Mongoose user document to the public API user type (no secrets). */
export function toPublicUser(
  doc: Record<string, unknown>,
  options?: { hasPassword?: boolean },
): PublicUser {
  const personalDetails = omitNullishFields({
    ...(doc.personalDetails as Record<string, unknown>),
  });
  delete personalDetails.password;

  const hasPassword = options?.hasPassword ?? userHasPassword(doc);

  return {
    id: String(doc._id),
    personalDetails,
    preferences: toPublicUserPreferences(doc),
    emailVerified: doc.emailVerified === true,
    authProvider: (doc.authProvider as AuthProvider) ?? "credentials",
    profileComplete: isProfileComplete(personalDetails),
    hasPassword,
    isActive: doc.isActive !== false,
    createdAt: doc.createdAt as Date | undefined,
    updatedAt: doc.updatedAt as Date | undefined,
    lastLoginAt: doc.lastLoginAt as Date | undefined,
    lastActiveAt: doc.lastActiveAt as Date | undefined,
  };
}

// --- Lookups ---

export async function findByEmail(email: string) {
  return User.findOne({ "personalDetails.email": email.toLowerCase().trim() });
}

export async function findById(id: string) {
  return User.findById(id).select("-personalDetails.password -verificationToken -resetPasswordToken -resetPasswordExpires");
}

/** Load the current user document including password hash for `hasPassword` (route strips before response). */
export async function findByIdForMe(id: string) {
  return User.findById(id).select("-verificationToken -resetPasswordToken -resetPasswordExpires").lean();
}

export async function findByGoogleSubjectId(sub: string) {
  return User.findOne({ googleSubjectId: sub });
}

// --- User creation ---

/**
 * Register a new email/password user with only auth-required fields.
 * Used by `authService.register`.
 */
export async function createCredentialsUser(input: {
  email: string;
  password: string;
  username?: string;
  firstName?: string;
  lastName?: string;
  referralReference?: string;
  preferredLanguage?: string;
}) {
  const normalizedEmail = input.email.toLowerCase().trim();
  const hashedPassword = await bcrypt.hash(input.password, 10);

  const personalDetails: Record<string, unknown> = {
    email: normalizedEmail,
    password: hashedPassword,
  };

  const username = input.username?.trim();
  const firstName = input.firstName?.trim();
  const lastName = input.lastName?.trim();

  if (username) personalDetails.username = username.slice(0, 50);
  if (firstName) personalDetails.firstName = firstName.slice(0, 50);
  if (lastName) personalDetails.lastName = lastName.slice(0, 50);
  personalDetails.preferredLanguage = normalizeLocale(input.preferredLanguage);

  const user = await User.create({
    authProvider: "credentials",
    personalDetails,
    preferences: DEFAULT_PUBLIC_USER_PREFERENCES,
  });

  await linkInvitesByEmail(normalizedEmail, String(user._id));

  if (input.referralReference?.trim()) {
    await linkRelationshipByReferral(
      input.referralReference.trim(),
      String(user._id),
      normalizedEmail,
    );
  }

  return user;
}

/**
 * Resolve the DB user for a Google sign-in:
 * 1. Match by Google subject id
 * 2. Else link an existing email account
 * 3. Else create a new Google user
 */
export async function findOrCreateFromGoogle(profile: GoogleProfileInput) {
  const normalizedEmail = profile.email.toLowerCase().trim();
  const existingBySub = await findByGoogleSubjectId(profile.sub);
  if (existingBySub) {
    return { user: existingBySub, created: false };
  }

  const existingByEmail = await findByEmail(normalizedEmail);
  if (existingByEmail) {
    existingByEmail.googleSubjectId = profile.sub;
    if (!existingByEmail.authProvider) {
      existingByEmail.authProvider = "google";
    }
    if (profile.emailVerified) {
      existingByEmail.emailVerified = true;
    }
    if (profile.image && !existingByEmail.personalDetails.imageUrl) {
      existingByEmail.personalDetails.imageUrl = profile.image;
    }
    await existingByEmail.save();
    return { user: existingByEmail, created: false };
  }

  const personalDetails: Record<string, unknown> = {
    email: normalizedEmail,
    ...splitNameIfPresent(profile.name),
  };

  if (profile.image) {
    personalDetails.imageUrl = profile.image;
  }

  personalDetails.preferredLanguage = normalizeLocale(profile.preferredLanguage);

  const user = await User.create({
    authProvider: "google",
    googleSubjectId: profile.sub,
    emailVerified: profile.emailVerified,
    personalDetails,
    preferences: DEFAULT_PUBLIC_USER_PREFERENCES,
  });

  await linkInvitesByEmail(normalizedEmail, String(user._id));

  return { user, created: true };
}

/**
 * Ensure `personalDetails.preferredLanguage` is set (e.g. Google bridge before cookies).
 * No-op when the user already has a saved preference.
 */
export async function ensurePreferredLanguage(userId: string, fallback: AppLocale) {
  const user = await User.findById(userId).select("personalDetails.preferredLanguage");
  if (!user) return;

  const current = user.personalDetails?.preferredLanguage;
  if (typeof current === "string" && current.trim()) {
    return;
  }

  await User.updateOne(
    { _id: userId },
    { $set: { "personalDetails.preferredLanguage": normalizeLocale(fallback) } },
  );
}

// --- Profile updates ---

function shouldUnset(value: unknown): boolean {
  return value === null || value === "";
}

/** Patch `personalDetails` fields validated by `updatePersonalDetailsSchema`. */
export async function updatePersonalDetails(userId: string, data: UpdatePersonalDetailsInput) {
  const set: Record<string, unknown> = {};
  const unset: Record<string, ""> = {};

  for (const [key, value] of Object.entries(data)) {
    if (value === undefined) {
      continue;
    }

    if (key === "address") {
      if (value === null) {
        unset["personalDetails.address"] = "";
        continue;
      }

      for (const [subKey, subValue] of Object.entries(value)) {
        if (shouldUnset(subValue)) {
          unset[`personalDetails.address.${subKey}`] = "";
        } else if (subValue !== undefined) {
          set[`personalDetails.address.${subKey}`] = subValue;
        }
      }
      continue;
    }

    if (key === "preferences") {
      if (!value || typeof value !== "object") {
        continue;
      }

      for (const [prefKey, prefValue] of Object.entries(value)) {
        if (prefValue === undefined) {
          continue;
        }

        if (shouldUnset(prefValue)) {
          unset[`preferences.${prefKey}`] = "";
        } else {
          set[`preferences.${prefKey}`] = prefValue;
        }
      }
      continue;
    }

    if (shouldUnset(value)) {
      unset[`personalDetails.${key}`] = "";
      continue;
    }

    set[`personalDetails.${key}`] = value;
  }

  const update: Record<string, unknown> = {};
  if (Object.keys(set).length > 0) {
    update.$set = set;
  }
  if (Object.keys(unset).length > 0) {
    update.$unset = unset;
  }

  if (Object.keys(update).length === 0) {
    const user = await User.findById(userId)
      .select("-personalDetails.password -verificationToken -resetPasswordToken -resetPasswordExpires")
      .lean();
    if (!user) {
      return null;
    }
    return toPublicUser(user as Record<string, unknown>);
  }

  const user = await User.findByIdAndUpdate(
    userId,
    update,
    { returnDocument: "after", runValidators: true },
  )
    .select("-personalDetails.password -verificationToken -resetPasswordToken -resetPasswordExpires")
    .lean();

  if (!user) {
    return null;
  }

  return toPublicUser(user as Record<string, unknown>);
}

/** Upload a new avatar to Cloudinary, remove the old file, and save the new URL. */
export async function updateProfileImage(userId: string, imageFile: UploadInputFile) {
  const user = await User.findById(userId).select("personalDetails.imageUrl");
  if (!user) {
    return null;
  }

  const uploadResult = await uploadFilesCloudinary({
    folder: `/users/${userId}`,
    filesArr: [imageFile],
    onlyImages: true,
  });

  const [newImageUrl] = assertCloudinaryUploadUrls(uploadResult);

  const deleteResult = await deleteFilesCloudinary(user.personalDetails?.imageUrl || "");
  assertCloudinaryDeleteSuccess(deleteResult);

  const updated = await User.findByIdAndUpdate(
    userId,
    { $set: { "personalDetails.imageUrl": newImageUrl } },
    { returnDocument: "after", runValidators: true },
  )
    .select("-personalDetails.password -verificationToken -resetPasswordToken -resetPasswordExpires")
    .lean();

  if (!updated) {
    return null;
  }

  return toPublicUser(updated as Record<string, unknown>);
}

/** Deactivate the account without deleting the document. */
export async function softDelete(userId: string) {
  const user = await User.findByIdAndUpdate(
    userId,
    { $set: { isActive: false } },
    { returnDocument: "after" },
  )
    .select("-personalDetails.password")
    .lean();

  if (!user) return null;
  return toPublicUser(user as Record<string, unknown>);
}
