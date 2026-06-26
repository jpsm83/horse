/**
 * Gmail transactional email transport for Equus.
 * Ported from health/lib/utils/email.ts — used by auth flows and product invites.
 */

import nodemailer from "nodemailer";
import type { EmailTemplateContent } from "./types.ts";

export function createEmailTransporter() {
  return nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASSWORD,
    },
  });
}

export function validateEmailConfig(): void {
  if (!process.env.EMAIL_USER || !process.env.EMAIL_PASSWORD) {
    throw new Error(
      "Email configuration is missing. Please set EMAIL_USER and EMAIL_PASSWORD environment variables.",
    );
  }
}

export function getDefaultFromAddress(): string {
  return `"Equus" <${process.env.EMAIL_USER}>`;
}

export interface SendEmailOptions {
  from?: string;
  to: string;
  subject: string;
  html: string;
  text: string;
}

export async function sendEmail(mailOptions: SendEmailOptions): Promise<{ messageId: string }> {
  validateEmailConfig();

  const transporter = createEmailTransporter();
  const info = await transporter.sendMail({
    from: mailOptions.from ?? getDefaultFromAddress(),
    to: mailOptions.to,
    subject: mailOptions.subject,
    html: mailOptions.html,
    text: mailOptions.text,
  });

  console.info("Email sent successfully:", info.messageId);
  return { messageId: String(info.messageId) };
}

/** Sends a template content object to one recipient. */
export async function sendTemplateEmail(options: {
  to: string;
  content: EmailTemplateContent;
  from?: string;
}): Promise<void> {
  const to = options.to.trim();
  if (!to) {
    throw new Error("Recipient email is required");
  }

  await sendEmail({
    from: options.from,
    to,
    subject: options.content.subject,
    html: options.content.html,
    text: options.content.text,
  });
}
