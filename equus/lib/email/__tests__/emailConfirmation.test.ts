import { describe, expect, it } from "vitest";
import { buildEmailConfirmationContent } from "@/lib/email/templates/emailConfirmation.ts";

describe("emailConfirmation template", () => {
  it("includes link, fixed copy, and greeting", () => {
    const url = "https://app.test/confirm-email?token=abc";
    const { subject, html, text } = buildEmailConfirmationContent({
      confirmUrl: url,
      greetingName: "Pat",
    });

    expect(subject).toBe("Confirm Your Email - Equus");
    expect(html).toContain(`href="${url}"`);
    expect(html).toContain("24 hours");
    expect(html).toContain("Hello Pat!");
    expect(html).not.toContain("<script>");
    expect(text).toContain(url);
    expect(text).toContain("24 hours");
    expect(text).toContain("Hello Pat!");
  });

  it("uses a neutral greeting when name is missing", () => {
    const { html, text } = buildEmailConfirmationContent({
      confirmUrl: "https://x.test/c",
    });
    expect(html).toContain("Hello there!");
    expect(text).toContain("Hello there!");
  });

  it("falls back to English for unknown locale", () => {
    const { subject } = buildEmailConfirmationContent({
      confirmUrl: "https://x.test/c",
      locale: "xx",
    });
    expect(subject).toBe("Confirm Your Email - Equus");
  });

  it("uses Spanish copy when locale is es", () => {
    const { subject } = buildEmailConfirmationContent({
      confirmUrl: "https://x.test/c",
      locale: "es",
    });
    expect(subject).toBe("Confirma tu Email - Equus");
  });
});
