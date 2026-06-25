import crypto from "crypto";
import bcrypt from "bcrypt";
import User from "../../models/User.ts";
import type { AuthProvider, GoogleProfileInput } from "../auth/types.ts";
import { isProfileComplete } from "../auth/session.ts";
import uploadFilesCloudinary from "../cloudinary/uploadFilesCloudinary.ts";
import deleteFilesCloudinary from "../cloudinary/deleteFilesCloudinary.ts";
import {
  assertCloudinaryDeleteSuccess,
  assertCloudinaryUploadUrls,
} from "../cloudinary/assertUpload.ts";
import type { UploadInputFile } from "../cloudinary/types.ts";
import type { z } from "zod";
import type { updatePersonalDetailsSchema } from "../validations/user.ts";

export type UpdatePersonalDetailsInput = z.infer<typeof updatePersonalDetailsSchema>;

export type PublicUser = {
  id: string;
  personalDetails: Record<string, unknown>;
  emailVerified: boolean;
  authProvider: AuthProvider;
  profileComplete: boolean;
  isActive: boolean;
  ownerPreferences?: unknown;
  activeAccountContext?: unknown;
  createdAt?: Date;
  updatedAt?: Date;
  lastLoginAt?: Date;
  lastActiveAt?: Date;
};

const PLACEHOLDER_ADDRESS = {
  country: "Unknown",
  state: "Unknown",
  city: "Unknown",
  street: "Unknown",
  buildingNumber: "0",
  postCode: "0000",
};

async function createUnusablePasswordHash(): Promise<string> {
  const random = crypto.randomBytes(32).toString("hex");
  return bcrypt.hash(random, 10);
}

function splitName(name?: string | null): { firstName: string; lastName: string } {
  const trimmed = name?.trim() || "User";
  const parts = trimmed.split(/\s+/);
  const firstName = parts[0] || "User";
  const lastName = parts.slice(1).join(" ") || "User";
  return { firstName, lastName };
}

export function toPublicUser(doc: Record<string, unknown>): PublicUser {
  const personalDetails = { ...(doc.personalDetails as Record<string, unknown>) };
  delete personalDetails.password;

  return {
    id: String(doc._id),
    personalDetails,
    emailVerified:
      personalDetails.emailVerified === true || doc.emailVerified === true,
    authProvider: (doc.authProvider as AuthProvider) ?? "credentials",
    profileComplete: isProfileComplete(
      personalDetails as { address?: { country?: string } },
    ),
    isActive: doc.isActive !== false,
    ownerPreferences: doc.ownerPreferences,
    activeAccountContext: doc.activeAccountContext,
    createdAt: doc.createdAt as Date | undefined,
    updatedAt: doc.updatedAt as Date | undefined,
    lastLoginAt: doc.lastLoginAt as Date | undefined,
    lastActiveAt: doc.lastActiveAt as Date | undefined,
  };
}

export async function findByEmail(email: string) {
  return User.findOne({ "personalDetails.email": email.toLowerCase().trim() });
}

export async function findById(id: string) {
  return User.findById(id).select("-personalDetails.password -verificationToken -resetPasswordToken -resetPasswordExpires");
}

export async function findByGoogleSubjectId(sub: string) {
  return User.findOne({ googleSubjectId: sub });
}

export async function createMinimalUser(input: {
  email: string;
  password: string;
  username?: string;
  firstName?: string;
  lastName?: string;
}) {
  const normalizedEmail = input.email.toLowerCase().trim();
  const hashedPassword = await bcrypt.hash(input.password, 10);
  const emailPrefix = normalizedEmail.split("@")[0] || "user";

  const user = await User.create({
    authProvider: "credentials",
    personalDetails: {
      username: (input.username?.trim() || emailPrefix).slice(0, 50),
      email: normalizedEmail,
      password: hashedPassword,
      idType: "Passport",
      idNumber: `AUTO-${Date.now()}`,
      address: PLACEHOLDER_ADDRESS,
      firstName: (input.firstName?.trim() || "New").slice(0, 50),
      lastName: (input.lastName?.trim() || "User").slice(0, 50),
      nationality: "Unknown",
      gender: "Other",
      birthDate: new Date("2000-01-01T00:00:00.000Z"),
      phoneNumber: "0000000000",
    },
  });

  return user;
}

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

  const unusableHash = await createUnusablePasswordHash();
  const { firstName, lastName } = splitName(profile.name);
  const emailPrefix = normalizedEmail.split("@")[0] || "user";

  const user = await User.create({
    authProvider: "google",
    googleSubjectId: profile.sub,
    emailVerified: profile.emailVerified,
    personalDetails: {
      username: emailPrefix.slice(0, 50),
      email: normalizedEmail,
      password: unusableHash,
      emailVerified: profile.emailVerified,
      idType: "Passport",
      idNumber: `AUTO-${Date.now()}`,
      address: PLACEHOLDER_ADDRESS,
      firstName,
      lastName,
      nationality: "Unknown",
      gender: "Other",
      birthDate: new Date("2000-01-01T00:00:00.000Z"),
      phoneNumber: "0000000000",
      imageUrl: profile.image || undefined,
    },
  });

  return { user, created: true };
}

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
