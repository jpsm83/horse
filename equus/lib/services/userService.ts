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
import { isProfileComplete } from "../auth/session.ts";
import type { AuthProvider, GoogleProfileInput } from "../auth/types.ts";
import uploadFilesCloudinary from "../cloudinary/uploadFilesCloudinary.ts";
import deleteFilesCloudinary from "../cloudinary/deleteFilesCloudinary.ts";
import {
  assertCloudinaryDeleteSuccess,
  assertCloudinaryUploadUrls,
} from "../cloudinary/assertUpload.ts";
import type { UploadInputFile } from "../cloudinary/types.ts";
import type { z } from "zod";
import type { updatePersonalDetailsSchema } from "../validations/user.ts";
import { linkInvitesByEmail } from "./roleMembershipService.ts";

export type UpdatePersonalDetailsInput = z.infer<typeof updatePersonalDetailsSchema>;

/** Safe user shape returned by the API (password and tokens stripped). */
export type PublicUser = {
  id: string;
  personalDetails: Record<string, unknown>;
  emailVerified: boolean;
  authProvider: AuthProvider;
  profileComplete: boolean;
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

/** Map a Mongoose user document to the public API user type (no secrets). */
export function toPublicUser(doc: Record<string, unknown>): PublicUser {
  const personalDetails = { ...(doc.personalDetails as Record<string, unknown>) };
  delete personalDetails.password;

  return {
    id: String(doc._id),
    personalDetails,
    emailVerified:
      personalDetails.emailVerified === true || doc.emailVerified === true,
    authProvider: (doc.authProvider as AuthProvider) ?? "credentials",
    profileComplete: isProfileComplete(personalDetails),
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

  const user = await User.create({
    authProvider: "credentials",
    personalDetails,
  });

  await linkInvitesByEmail(normalizedEmail, String(user._id));

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
      existingByEmail.personalDetails.emailVerified = true;
    }
    if (profile.image && !existingByEmail.personalDetails.imageUrl) {
      existingByEmail.personalDetails.imageUrl = profile.image;
    }
    await existingByEmail.save();
    return { user: existingByEmail, created: false };
  }

  const personalDetails: Record<string, unknown> = {
    email: normalizedEmail,
    emailVerified: profile.emailVerified,
    ...splitNameIfPresent(profile.name),
  };

  if (profile.image) {
    personalDetails.imageUrl = profile.image;
  }

  const user = await User.create({
    authProvider: "google",
    googleSubjectId: profile.sub,
    emailVerified: profile.emailVerified,
    personalDetails,
  });

  await linkInvitesByEmail(normalizedEmail, String(user._id));

  return { user, created: true };
}

// --- Profile updates ---

/** Patch `personalDetails` fields validated by `updatePersonalDetailsSchema`. */
export async function updatePersonalDetails(userId: string, data: UpdatePersonalDetailsInput) {
  const update: Record<string, unknown> = {};

  for (const [key, value] of Object.entries(data)) {
    if (value !== undefined) {
      update[`personalDetails.${key}`] = value;
    }
  }

  const user = await User.findByIdAndUpdate(
    userId,
    { $set: update },
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
