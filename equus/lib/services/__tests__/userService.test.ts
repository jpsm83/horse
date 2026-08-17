import { describe, expect, it, vi, beforeEach } from "vitest";
import User from "@/models/User.ts";
import * as userService from "@/lib/services/userService.ts";
import { handleConfirmEmail } from "@/lib/auth/confirmEmail.ts";
import uploadFilesCloudinary from "@/lib/cloudinary/uploadFilesCloudinary.ts";

vi.mock("@/lib/cloudinary/uploadFilesCloudinary.ts", () => ({
  default: vi.fn().mockResolvedValue([
    "https://res.cloudinary.com/demo/image/upload/v1/equus/users/test/avatar.jpg",
  ]),
}));

vi.mock("@/lib/cloudinary/deleteFilesCloudinary.ts", () => ({
  default: vi.fn().mockResolvedValue(true),
}));

const completeProfilePatch = {
  username: "jane",
  firstName: "Jane",
  lastName: "Doe",
  idType: "Passport" as const,
  idNumber: "P123456",
  address: {
    country: "PT",
    state: "Lisbon",
    city: "Lisbon",
    street: "Main",
    buildingNumber: "1",
    doorNumber: "2A",
    complement: "Floor 2",
    postCode: "1000",
    region: "Lisbon",
    additionalDetails: "Near the park",
    coordinates: [-9.1393, 38.7223] as [number, number],
  },
  nationality: "PT",
  gender: "Woman" as const,
  birthDate: new Date("1990-01-01"),
  phoneNumber: "+351912345678",
  imageUrl: "https://example.com/avatar.png",
  bio: "Horse owner",
  preferredLanguage: "en" as const,
};

describe("userService", () => {
  it("createCredentialsUser stores only provided auth fields and hashes password", async () => {
    const user = await userService.createCredentialsUser({
      email: "owner@example.com",
      password: "TestPass1!",
      firstName: "Jane",
      lastName: "Doe",
    });

    expect(user.personalDetails.email).toBe("owner@example.com");
    expect(user.personalDetails.firstName).toBe("Jane");
    expect(user.personalDetails.lastName).toBe("Doe");
    expect(user.personalDetails.preferredLanguage).toBe("en");
    expect(user.personalDetails.address).toBeUndefined();
    expect(user.personalDetails.username).toBeUndefined();
    expect(user.personalDetails.idNumber).toBeUndefined();
    expect(user.ownerPreferences).toBeUndefined();
    expect(user.activeAccountContext).toBeUndefined();
    expect(user.trainerProfileId).toBeUndefined();
    expect(user.authProvider).toBe("credentials");
    expect(user.personalDetails.password).not.toBe("TestPass1!");

    const publicUser = userService.toPublicUser(user.toObject() as Record<string, unknown>);
    expect(publicUser.personalDetails.password).toBeUndefined();
    expect(publicUser.preferences).toEqual({
      profileVisibility: "public",
      allowDirectMessagesFrom: "everyone",
    });
    expect(publicUser.hasPassword).toBe(true);
    expect(publicUser.profileComplete).toBe(false);
  });

  it("updatePersonalDetails marks profile complete when all personalDetails and address fields are set", async () => {
    const created = await userService.createCredentialsUser({
      email: "patch@example.com",
      password: "TestPass1!",
    });

    const updated = await userService.updatePersonalDetails(
      String(created._id),
      completeProfilePatch,
    );

    expect(updated?.profileComplete).toBe(true);
    expect(updated?.personalDetails.phoneNumber).toBe("+351912345678");
  });

  it("updatePersonalDetails clears optional fields when empty string is sent", async () => {
    const created = await userService.createCredentialsUser({
      email: "clear@example.com",
      password: "TestPass1!",
    });

    await userService.updatePersonalDetails(String(created._id), {
      phoneNumber: "+351912345678",
      bio: "Horse owner",
    });

    const cleared = await userService.updatePersonalDetails(String(created._id), {
      phoneNumber: "",
      bio: "",
    });

    expect(cleared?.personalDetails.phoneNumber).toBeUndefined();
    expect(cleared?.personalDetails.bio).toBeUndefined();
  });

  it("updatePersonalDetails updates user visibility preferences", async () => {
    const created = await userService.createCredentialsUser({
      email: "preferences@example.com",
      password: "TestPass1!",
    });

    const updated = await userService.updatePersonalDetails(String(created._id), {
      preferences: {
        profileVisibility: "relationships",
        allowDirectMessagesFrom: "relationships",
      },
    });

    expect(updated?.preferences).toEqual({
      profileVisibility: "relationships",
      allowDirectMessagesFrom: "relationships",
    });
  });

  it("updatePersonalDetails rejects duplicate usernames", async () => {
    await userService.createCredentialsUser({
      email: "username-owner@example.com",
      password: "TestPass1!",
      username: "publicowner",
    });

    const other = await userService.createCredentialsUser({
      email: "username-other@example.com",
      password: "TestPass1!",
    });

    await expect(
      userService.updatePersonalDetails(String(other._id), {
        username: "PublicOwner",
      }),
    ).rejects.toMatchObject({
      statusCode: 409,
      code: "CONFLICT",
    });
  });

  it("updatePersonalDetails allows keeping the same username", async () => {
    const user = await userService.createCredentialsUser({
      email: "username-keep@example.com",
      password: "TestPass1!",
      username: "KeepMe",
    });

    const updated = await userService.updatePersonalDetails(String(user._id), {
      username: "keepme",
      bio: "Still me",
    });

    expect(updated?.personalDetails.username).toBe("keepme");
    expect(updated?.personalDetails.bio).toBe("Still me");
  });

  it("createCredentialsUser rejects duplicate usernames at signup", async () => {
    await userService.createCredentialsUser({
      email: "signup-username-a@example.com",
      password: "TestPass1!",
      username: "signupuser",
    });

    await expect(
      userService.createCredentialsUser({
        email: "signup-username-b@example.com",
        password: "TestPass1!",
        username: "SignupUser",
      }),
    ).rejects.toMatchObject({
      statusCode: 409,
      code: "CONFLICT",
    });
  });

  it("toPublicUser omits null fields from personalDetails", async () => {
    const created = await userService.createCredentialsUser({
      email: "legacy@example.com",
      password: "TestPass1!",
    });

    await User.updateOne(
      { _id: created._id },
      { $set: { "personalDetails.bio": null } },
    );

    const reloaded = await userService.findById(String(created._id));
    const publicUser = userService.toPublicUser(reloaded as Record<string, unknown>);

    expect(publicUser.personalDetails.bio).toBeUndefined();
  });

  it("findOrCreateFromGoogle creates a user with only Google-provided data", async () => {
    const { user, created } = await userService.findOrCreateFromGoogle({
      sub: "google-sub-1",
      email: "google@example.com",
      emailVerified: true,
      name: "Google User",
      image: "https://example.com/avatar.png",
    });

    expect(created).toBe(true);
    expect(user.googleSubjectId).toBe("google-sub-1");
    expect(user.authProvider).toBe("google");
    expect(user.emailVerified).toBe(true);
    expect(user.personalDetails.email).toBe("google@example.com");
    expect(user.personalDetails.firstName).toBe("Google");
    expect(user.personalDetails.lastName).toBe("User");
    expect(user.personalDetails.imageUrl).toBe("https://example.com/avatar.png");
    expect(user.personalDetails.preferredLanguage).toBe("en");
    expect(user.personalDetails.password).toBeUndefined();
    expect(user.personalDetails.username).toBeUndefined();
    expect(user.personalDetails.idNumber).toBeUndefined();
    expect(user.personalDetails.address).toBeUndefined();

    const publicUser = userService.toPublicUser(user.toObject() as Record<string, unknown>);
    expect(publicUser.hasPassword).toBe(false);
    expect(publicUser.profileComplete).toBe(false);
  });

  it("findOrCreateFromGoogle stores preferredLanguage when provided", async () => {
    const { user } = await userService.findOrCreateFromGoogle({
      sub: "google-sub-lang",
      email: "lang@example.com",
      emailVerified: true,
      preferredLanguage: "es",
    });

    expect(user.personalDetails.preferredLanguage).toBe("es");
  });

  it("ensurePreferredLanguage backfills missing preference", async () => {
    const created = await userService.createCredentialsUser({
      email: "backfill@example.com",
      password: "TestPass1!",
    });

    await User.updateOne(
      { _id: created._id },
      { $unset: { "personalDetails.preferredLanguage": "" } },
    );

    await userService.ensurePreferredLanguage(String(created._id), "es");

    const updated = await User.findById(created._id).lean();
    expect(updated?.personalDetails?.preferredLanguage).toBe("es");
  });

  it("findOrCreateFromGoogle links an existing email account", async () => {
    await userService.createCredentialsUser({
      email: "link@example.com",
      password: "TestPass1!",
    });

    const { user, created } = await userService.findOrCreateFromGoogle({
      sub: "google-sub-link",
      email: "link@example.com",
      emailVerified: true,
    });

    expect(created).toBe(false);
    expect(user.googleSubjectId).toBe("google-sub-link");
    expect(user.authProvider).toBe("credentials");
    expect(userService.userHasPassword(user.toObject() as Record<string, unknown>)).toBe(
      true,
    );
  });

  it("softDelete deactivates account and bumps refreshSessionVersion", async () => {
    const created = await userService.createCredentialsUser({
      email: "delete@example.com",
      password: "TestPass1!",
    });

    const before = await User.findById(created._id).select("refreshSessionVersion").lean();
    const versionBefore = before?.refreshSessionVersion ?? 0;

    const deleted = await userService.softDelete(String(created._id));
    expect(deleted?.isActive).toBe(false);

    const reloaded = await User.findById(created._id).lean();
    expect(reloaded?.isActive).toBe(false);
    expect(reloaded?.refreshSessionVersion).toBe(versionBefore + 1);
    expect(reloaded?.deactivatedAt).toBeInstanceOf(Date);
    expect(String(reloaded?.deactivatedByUserId)).toBe(String(created._id));
  });

  it("updateProfileImage uploads to Cloudinary and stores secure URL", async () => {
    const created = await userService.createCredentialsUser({
      email: "image@example.com",
      password: "TestPass1!",
    });
    const userId = String(created._id);

    const updated = await userService.updateProfileImage(userId, {
      buffer: Buffer.from("fake-image"),
      mimeType: "image/jpeg",
    });

    expect(vi.mocked(uploadFilesCloudinary)).toHaveBeenCalledWith({
      folder: `/users/${userId}`,
      filesArr: [{ buffer: expect.any(Buffer), mimeType: "image/jpeg" }],
      onlyImages: true,
    });
    expect(updated?.personalDetails.imageUrl).toContain("cloudinary.com");
  });
});

describe("handleConfirmEmail", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("verifies email when token matches", async () => {
    const user = await userService.createCredentialsUser({
      email: "confirm@example.com",
      password: "TestPass1!",
    });
    const token = "a".repeat(64);
    await User.updateOne({ _id: user._id }, { $set: { verificationToken: token } });

    const result = await handleConfirmEmail(token);
    expect(result.kind).toBe("success_200");

    const reloaded = await User.findById(user._id).lean();
    expect(reloaded?.emailVerified).toBe(true);
    expect(reloaded?.verificationToken).toBeUndefined();
  });

  it("returns client_error for unknown token", async () => {
    const result = await handleConfirmEmail("missing-token");
    expect(result.kind).toBe("client_error");
  });
});
