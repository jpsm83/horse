import { describe, expect, it } from "vitest";
import {
  forgotPasswordFormSchema,
  resendConfirmationFormSchema,
  resetPasswordFormSchema,
  signInFormSchema,
  signUpFormSchema,
} from "@/lib/validations/authForms.ts";

describe("signInFormSchema", () => {
  it("requires email and password", () => {
    const result = signInFormSchema.safeParse({ email: "", password: "" });
    expect(result.success).toBe(false);
    if (!result.success) {
      const messages = result.error.issues.map((issue) => issue.message);
      expect(messages).toContain("Email is required");
      expect(messages).toContain("Password is required");
    }
  });

  it("rejects invalid email format", () => {
    const result = signInFormSchema.safeParse({ email: "not-an-email", password: "secret" });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues.some((i) => i.message.includes("valid email"))).toBe(true);
    }
  });

  it("accepts valid credentials shape", () => {
    const result = signInFormSchema.safeParse({
      email: "User@Example.com",
      password: "secret",
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.email).toBe("user@example.com");
    }
  });
});

describe("signUpFormSchema", () => {
  it("requires email and password with policy message", () => {
    const result = signUpFormSchema.safeParse({
      email: "",
      password: "short",
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      const messages = result.error.issues.map((issue) => issue.message);
      expect(messages).toContain("Email is required");
      expect(messages.some((m) => m.includes("at least 8 characters"))).toBe(true);
    }
  });

  it("allows optional names", () => {
    const result = signUpFormSchema.safeParse({
      email: "new@example.com",
      password: "TestPass1!",
    });
    expect(result.success).toBe(true);
  });
});

describe("forgotPasswordFormSchema", () => {
  it("requires valid email", () => {
    const result = forgotPasswordFormSchema.safeParse({ email: "" });
    expect(result.success).toBe(false);
  });

  it("accepts valid email", () => {
    const result = forgotPasswordFormSchema.safeParse({ email: "user@example.com" });
    expect(result.success).toBe(true);
  });
});

describe("resendConfirmationFormSchema", () => {
  it("requires valid email", () => {
    const result = resendConfirmationFormSchema.safeParse({ email: "bad" });
    expect(result.success).toBe(false);
  });
});

describe("resetPasswordFormSchema", () => {
  it("rejects mismatched passwords", () => {
    const result = resetPasswordFormSchema.safeParse({
      newPassword: "TestPass1!",
      confirmPassword: "TestPass2!",
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues.some((i) => i.path.includes("confirmPassword"))).toBe(true);
    }
  });

  it("accepts matching passwords with policy", () => {
    const result = resetPasswordFormSchema.safeParse({
      newPassword: "TestPass1!",
      confirmPassword: "TestPass1!",
    });
    expect(result.success).toBe(true);
  });
});
