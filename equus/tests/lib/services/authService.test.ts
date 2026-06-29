import { describe, expect, it, vi, beforeEach } from "vitest";
import { ApiError } from "@/lib/api/errors.ts";
import User from "@/models/User.ts";
import * as authService from "@/lib/services/authService.ts";
import { verifyAccessToken, verifyRefreshToken } from "@/lib/auth/jwt.ts";
import { handleResetPassword } from "@/lib/auth/resetPassword.ts";

vi.mock("@/lib/email/sendEmail.ts", () => ({
  sendTemplateEmail: vi.fn().mockResolvedValue(undefined),
  sendEmail: vi.fn().mockResolvedValue({ messageId: "test" }),
}));

describe("authService", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("register returns tokens and creates a user", async () => {
    const result = await authService.register({
      email: "register@example.com",
      password: "TestPass1!",
      firstName: "Reg",
      lastName: "User",
    });

    expect(result.user.email).toBe("register@example.com");
    expect(result.user.profileComplete).toBe(false);
    expect(result.accessToken).toBeTruthy();
    expect(result.refreshToken).toBeTruthy();

    const session = await verifyAccessToken(result.accessToken);
    expect(session.id).toBe(result.user.id);
  });

  it("register rejects duplicate email", async () => {
    await authService.register({
      email: "dup@example.com",
      password: "TestPass1!",
    });

    await expect(
      authService.register({
        email: "dup@example.com",
        password: "TestPass1!",
      }),
    ).rejects.toBeInstanceOf(ApiError);
  });

  it("login returns tokens for valid credentials", async () => {
    await authService.register({
      email: "login@example.com",
      password: "TestPass1!",
    });

    await User.updateOne(
      { "personalDetails.email": "login@example.com" },
      { $set: { emailVerified: true } },
    );

    const result = await authService.login("login@example.com", "TestPass1!");
    expect(result.user.email).toBe("login@example.com");
    expect(result.accessToken).toBeTruthy();
  });

  it("login rejects unverified credentials users", async () => {
    await authService.register({
      email: "unverified@example.com",
      password: "TestPass1!",
    });

    await expect(
      authService.login("unverified@example.com", "TestPass1!"),
    ).rejects.toMatchObject({ statusCode: 403, code: "EMAIL_NOT_VERIFIED" });
  });

  it("login rejects invalid credentials", async () => {
    await authService.register({
      email: "badlogin@example.com",
      password: "TestPass1!",
    });

    await expect(
      authService.login("badlogin@example.com", "WrongPass1!"),
    ).rejects.toMatchObject({ statusCode: 401 });
  });

  it("refresh issues a new access token when refresh version matches", async () => {
    const registered = await authService.register({
      email: "refresh@example.com",
      password: "TestPass1!",
    });

    const refreshed = await authService.refresh(registered.refreshToken);
    expect(refreshed.accessToken).toBeTruthy();
    expect(refreshed.user.email).toBe("refresh@example.com");

    const payload = await verifyRefreshToken(refreshed.refreshToken);
    expect(payload.id).toBe(registered.user.id);
  });

  it("refresh fails after password reset bumps refreshSessionVersion", async () => {
    const registered = await authService.register({
      email: "reset@example.com",
      password: "TestPass1!",
    });

    const user = await User.findOne({ "personalDetails.email": "reset@example.com" });
    const resetToken = "reset-token-123";
    await User.updateOne(
      { _id: user!._id },
      {
        $set: {
          resetPasswordToken: resetToken,
          resetPasswordExpires: new Date(Date.now() + 60_000),
        },
      },
    );

    const resetResult = await handleResetPassword(resetToken, "NewPass2!");
    expect(resetResult.kind).toBe("success_200");

    await expect(authService.refresh(registered.refreshToken)).rejects.toMatchObject({
      statusCode: 401,
    });
  });

  it("validateCredentials returns null for wrong password", async () => {
    await authService.register({
      email: "creds@example.com",
      password: "TestPass1!",
    });

    const result = await authService.validateCredentials("creds@example.com", "WrongPass1!");
    expect(result).toBeNull();
  });
});
