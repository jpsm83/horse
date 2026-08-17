/**
 * Google ↔ credentials account linking — UA-24.
 */

import { describe, expect, it } from "vitest";
import User from "@/models/User.ts";
import { ApiError } from "@/lib/api/errors.ts";
import * as authService from "@/lib/services/authService.ts";
import * as userService from "@/lib/services/userService.ts";
import {
  linkGoogleToExistingUser,
  userHasGoogleLink,
} from "@/lib/auth/googleAccountLinking.ts";

describe("googleAccountLinking", () => {
  it("userHasGoogleLink is true when googleSubjectId is set", async () => {
    const { user } = await userService.findOrCreateFromGoogle({
      sub: "google-sub-detect",
      email: "detect-google@example.com",
      emailVerified: true,
    });

    expect(userHasGoogleLink(user.toObject() as Record<string, unknown>)).toBe(true);
  });

  it("linkGoogleToExistingUser preserves credentials authProvider and password", async () => {
    const credentials = await userService.createCredentialsUser({
      email: "link-preserve@example.com",
      password: "TestPass1!",
    });

    const linked = await linkGoogleToExistingUser(String(credentials._id), {
      sub: "google-sub-preserve",
      email: "link-preserve@example.com",
      emailVerified: true,
    });

    expect(linked.authProvider).toBe("credentials");
    expect(linked.googleSubjectId).toBe("google-sub-preserve");
    expect(userService.userHasPassword(linked.toObject() as Record<string, unknown>)).toBe(
      true,
    );

    const session = await authService.login("link-preserve@example.com", "TestPass1!");
    expect(session.user.email).toBe("link-preserve@example.com");
  });

  it("rejects linking a different Google subject to the same email", async () => {
    const credentials = await userService.createCredentialsUser({
      email: "link-mismatch@example.com",
      password: "TestPass1!",
    });

    await linkGoogleToExistingUser(String(credentials._id), {
      sub: "google-sub-original",
      email: "link-mismatch@example.com",
      emailVerified: true,
    });

    await expect(
      linkGoogleToExistingUser(String(credentials._id), {
        sub: "google-sub-other",
        email: "link-mismatch@example.com",
        emailVerified: true,
      }),
    ).rejects.toMatchObject({
      statusCode: 409,
      code: "GOOGLE_ACCOUNT_MISMATCH",
    });
  });

  it("rejects linking Google to an inactive account", async () => {
    const credentials = await userService.createCredentialsUser({
      email: "link-inactive@example.com",
      password: "TestPass1!",
    });

    await User.updateOne({ _id: credentials._id }, { $set: { isActive: false } });

    await expect(
      linkGoogleToExistingUser(String(credentials._id), {
        sub: "google-sub-inactive",
        email: "link-inactive@example.com",
        emailVerified: true,
      }),
    ).rejects.toMatchObject({
      statusCode: 403,
      code: "FORBIDDEN",
    });
  });
});

describe("authService.register with Google-linked email", () => {
  it("returns ACCOUNT_EXISTS_GOOGLE for Google-only accounts", async () => {
    await userService.findOrCreateFromGoogle({
      sub: "google-sub-register-block",
      email: "google-only-register@example.com",
      emailVerified: true,
    });

    await expect(
      authService.register({
        email: "google-only-register@example.com",
        password: "TestPass1!",
      }),
    ).rejects.toMatchObject({
      statusCode: 409,
      code: "ACCOUNT_EXISTS_GOOGLE",
    });
  });

  it("returns CONFLICT when email already has credentials (with or without Google link)", async () => {
    await userService.createCredentialsUser({
      email: "credentials-register-block@example.com",
      password: "TestPass1!",
    });

    await expect(
      authService.register({
        email: "credentials-register-block@example.com",
        password: "TestPass1!",
      }),
    ).rejects.toMatchObject({
      statusCode: 409,
      code: "CONFLICT",
    });
  });
});
