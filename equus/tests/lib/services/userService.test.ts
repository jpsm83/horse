import { describe, expect, it, vi, beforeEach } from "vitest";
import User from "@/models/User.ts";
import * as userService from "@/lib/services/userService.ts";
import { handleConfirmEmail } from "@/lib/auth/confirmEmail.ts";

vi.mock("@/lib/cloudinary/uploadFilesCloudinary.ts", () => ({
  default: vi.fn().mockResolvedValue([
    "https://res.cloudinary.com/demo/image/upload/v1/equus/users/test/avatar.jpg",
  ]),
}));

vi.mock("@/lib/cloudinary/deleteFilesCloudinary.ts", () => ({
  default: vi.fn().mockResolvedValue(true),
}));

describe("userService", () => {
  it("createMinimalUser stores placeholder profile and hashes password", async () => {
    const user = await userService.createMinimalUser({
      email: "owner@example.com",
      password: "TestPass1!",
      firstName: "Jane",
      lastName: "Doe",
    });

    expect(user.personalDetails.email).toBe("owner@example.com");
    expect(user.personalDetails.address.country).toBe("Unknown");
    expect(user.authProvider).toBe("credentials");
    expect(user.personalDetails.password).not.toBe("TestPass1!");

    const publicUser = userService.toPublicUser(user.toObject() as Record<string, unknown>);
    expect(publicUser.personalDetails.password).toBeUndefined();
    expect(publicUser.profileComplete).toBe(false);
  });

  it("updatePersonalDetails marks profile complete when address is real", async () => {
    const created = await userService.createMinimalUser({
      email: "patch@example.com",
      password: "TestPass1!",
    });

    const updated = await userService.updatePersonalDetails(String(created._id), {
      address: {
        country: "Portugal",
        state: "Lisbon",
        city: "Lisbon",
        street: "Main",
        buildingNumber: "1",
        postCode: "1000",
      },
      phoneNumber: "+351912345678",
      nationality: "Portuguese",
    });

    expect(updated?.profileComplete).toBe(true);
    expect(updated?.personalDetails.phoneNumber).toBe("+351912345678");
  });

  it("findOrCreateFromGoogle creates a new user", async () => {
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
  });

  it("findOrCreateFromGoogle links an existing email account", async () => {
    await userService.createMinimalUser({
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
  });

  it("softDelete sets isActive to false", async () => {
    const created = await userService.createMinimalUser({
      email: "delete@example.com",
      password: "TestPass1!",
    });

    const deleted = await userService.softDelete(String(created._id));
    expect(deleted?.isActive).toBe(false);

    const reloaded = await User.findById(created._id).lean();
    expect(reloaded?.isActive).toBe(false);
  });

  it("updateProfileImage uploads to Cloudinary and stores secure URL", async () => {
    const created = await userService.createMinimalUser({
      email: "image@example.com",
      password: "TestPass1!",
    });

    const updated = await userService.updateProfileImage(String(created._id), {
      buffer: Buffer.from("fake-image"),
      mimeType: "image/jpeg",
    });

    expect(updated?.personalDetails.imageUrl).toContain("cloudinary.com");
  });
});

describe("handleConfirmEmail", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("verifies email when token matches", async () => {
    const user = await userService.createMinimalUser({
      email: "confirm@example.com",
      password: "TestPass1!",
    });
    const token = "a".repeat(64);
    await User.updateOne({ _id: user._id }, { $set: { verificationToken: token } });

    const result = await handleConfirmEmail(token);
    expect(result.kind).toBe("success_200");

    const reloaded = await User.findById(user._id).lean();
    expect(reloaded?.emailVerified).toBe(true);
    expect(reloaded?.personalDetails?.emailVerified).toBe(true);
    expect(reloaded?.verificationToken).toBeUndefined();
  });

  it("returns client_error for unknown token", async () => {
    const result = await handleConfirmEmail("missing-token");
    expect(result.kind).toBe("client_error");
  });
});
