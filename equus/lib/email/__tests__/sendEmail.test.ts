import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";
import nodemailer from "nodemailer";
import { validateEmailConfig, sendEmail } from "@/lib/email/sendEmail.ts";

vi.mock("nodemailer", () => ({
  default: {
    createTransport: vi.fn(),
  },
}));

describe("sendEmail", () => {
  const originalEnv = { ...process.env };
  const sendMail = vi.fn();

  beforeEach(() => {
    process.env.EMAIL_USER = "test@example.com";
    process.env.EMAIL_PASSWORD = "secret";
    sendMail.mockReset();
    sendMail.mockResolvedValue({ messageId: "mock-id" });
    vi.mocked(nodemailer.createTransport).mockReturnValue({
      sendMail,
    } as never);
  });

  afterEach(() => {
    process.env = { ...originalEnv };
    vi.clearAllMocks();
  });

  it("validateEmailConfig throws when env is missing", () => {
    delete process.env.EMAIL_USER;
    expect(() => validateEmailConfig()).toThrow("EMAIL_USER and EMAIL_PASSWORD");
  });

  it("sendEmail delivers via nodemailer", async () => {
    const result = await sendEmail({
      to: "user@example.com",
      subject: "Test",
      html: "<p>Hi</p>",
      text: "Hi",
    });

    expect(result.messageId).toBe("mock-id");
    expect(sendMail).toHaveBeenCalledWith(
      expect.objectContaining({
        to: "user@example.com",
        subject: "Test",
      }),
    );
  });
});
