import crypto from "crypto";
import User from "../../models/User.ts";
import { buildResetPasswordLink } from "./emailLinks.ts";
import { buildPasswordResetEmailContent } from "@/lib/email/templates/passwordReset.ts";
import { sendTemplateEmail } from "@/lib/email/sendEmail.ts";
import { GENERIC_REQUEST_EMAIL_CONFIRMATION_MESSAGE } from "./requestEmailConfirmation.ts";

export type RequestPasswordResetHandlerResult =
  | { kind: "success_200"; message: string }
  | { kind: "server_error_500"; message: string };

export async function handleRequestPasswordReset(
  normalizedEmail: string,
): Promise<RequestPasswordResetHandlerResult> {
  const user = await User.findOne({ "personalDetails.email": normalizedEmail })
    .select("_id personalDetails.username personalDetails.firstName personalDetails.preferredLanguage")
    .lean();

  if (!user) {
    return { kind: "success_200", message: GENERIC_REQUEST_EMAIL_CONFIRMATION_MESSAGE };
  }

  const resetToken = crypto.randomBytes(32).toString("hex");
  const resetTokenExpiry = new Date(Date.now() + 3600000);

  const pd = user.personalDetails as {
    username?: string;
    firstName?: string;
    preferredLanguage?: string;
  } | undefined;
  const greetingName = pd?.username?.trim() || pd?.firstName?.trim() || undefined;
  const locale = pd?.preferredLanguage;

  await User.updateOne(
    { _id: user._id },
    { $set: { resetPasswordToken: resetToken, resetPasswordExpires: resetTokenExpiry } },
  );

  try {
    const resetUrl = buildResetPasswordLink(resetToken, locale);
    const content = buildPasswordResetEmailContent({ resetUrl, greetingName, locale });
    await sendTemplateEmail({ to: normalizedEmail, content });
  } catch {
    await User.updateOne(
      { _id: user._id },
      { $unset: { resetPasswordToken: "", resetPasswordExpires: "" } },
    );
    return {
      kind: "server_error_500",
      message: "Failed to send password reset email. Please try again later.",
    };
  }

  return { kind: "success_200", message: GENERIC_REQUEST_EMAIL_CONFIRMATION_MESSAGE };
}
