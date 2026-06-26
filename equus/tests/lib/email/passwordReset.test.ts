import { describe, expect, it } from "vitest";
import { buildPasswordResetEmailContent } from "@/lib/email/templates/passwordReset.ts";

describe("passwordReset template", () => {
  it("includes link and fixed expiry copy", () => {
    const url = "https://app.test/reset-password?token=xyz";
    const { subject, html, text } = buildPasswordResetEmailContent({
      resetUrl: url,
      greetingName: "Alex",
    });

    expect(subject).toBe("Password Reset Request - Equus");
    expect(html).toContain(`href="${url}"`);
    expect(html).toContain("1 hour");
    expect(html).toContain("Hello Alex!");
    expect(text).toContain(url);
    expect(text).toContain("1 hour");
  });

  it("uses a neutral greeting when name is missing", () => {
    const { html } = buildPasswordResetEmailContent({
      resetUrl: "https://x.test/r",
    });
    expect(html).toContain("Hello there!");
  });
});
