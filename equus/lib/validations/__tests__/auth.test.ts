import { describe, expect, it } from "vitest";
import {
  loginSchema,
  registerSchema,
  confirmEmailSchema,
  resetPasswordSchema,
} from "@/lib/validations/auth.ts";

describe("auth validations", () => {
  it("registerSchema accepts valid minimal input", () => {
    const parsed = registerSchema.parse({
      email: "User@Example.com",
      password: "TestPass1!",
    });
    expect(parsed.email).toBe("user@example.com");
  });

  it("registerSchema rejects weak passwords", () => {
    expect(() =>
      registerSchema.parse({ email: "a@b.com", password: "weak" }),
    ).toThrow();
  });

  it("loginSchema requires email and password", () => {
    expect(() => loginSchema.parse({ email: "a@b.com" })).toThrow();
    const parsed = loginSchema.parse({ email: "a@b.com", password: "x" });
    expect(parsed.email).toBe("a@b.com");
  });

  it("confirmEmailSchema requires a non-empty token", () => {
    expect(() => confirmEmailSchema.parse({ token: "" })).toThrow();
    expect(confirmEmailSchema.parse({ token: "abc" }).token).toBe("abc");
  });

  it("resetPasswordSchema enforces password policy", () => {
    expect(() =>
      resetPasswordSchema.parse({ token: "t", newPassword: "weak" }),
    ).toThrow();
    const parsed = resetPasswordSchema.parse({
      token: "reset-token",
      newPassword: "TestPass1!",
    });
    expect(parsed.newPassword).toBe("TestPass1!");
  });
});
