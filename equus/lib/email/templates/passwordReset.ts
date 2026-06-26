/**
 * Password reset email template — en/es locales.
 */

import { buildCtaButton, buildPlainTextEmail, wrapBrandedEmail } from "../layout.ts";
import { fallbackDisplayName, resolveEmailLocale } from "../locales.ts";
import type { EmailLocale, EmailTemplateContent } from "../types.ts";

const emailTranslations = {
  en: {
    subject: "Password Reset Request - Equus",
    greeting: "Hello",
    message:
      "You recently requested to reset your password for your Equus account. Click the button below to reset it.",
    resetButton: "Reset Password",
    ignoreMessage:
      "If you didn't request a password reset, please ignore this email or contact support if you have concerns.",
    expiryMessage: "This password reset link will expire in 1 hour for security reasons.",
    fallbackMessage:
      "If the button above doesn't work, copy and paste this link into your browser:",
    copyright: "© 2026 Equus. All rights reserved.",
  },
  es: {
    subject: "Solicitud de Restablecimiento de Contraseña - Equus",
    greeting: "Hola",
    message:
      "Recientemente solicitaste restablecer tu contraseña para tu cuenta Equus. Haz clic en el botón de abajo para restablecerla.",
    resetButton: "Restablecer Contraseña",
    ignoreMessage:
      "Si no solicitaste un restablecimiento de contraseña, ignora este correo o contacta al soporte si tienes inquietudes.",
    expiryMessage: "Este enlace de restablecimiento de contraseña expirará en 1 hora por razones de seguridad.",
    fallbackMessage: "Si el botón de arriba no funciona, copia y pega este enlace en tu navegador:",
    copyright: "© 2026 Equus. Todos los derechos reservados.",
  },
} satisfies Record<EmailLocale, Record<string, string>>;

export function passwordResetTemplate(
  resetLink: string,
  username: string,
  locale?: string,
): EmailTemplateContent {
  const resolvedLocale = resolveEmailLocale(locale);
  const t = emailTranslations[resolvedLocale];
  const displayName = fallbackDisplayName(username);

  const bodyHtml = `
    <h2 style="color: #374151; margin-bottom: 20px;">${t.greeting} ${displayName}!</h2>
    <p style="color: #6b7280; line-height: 1.6; margin-bottom: 20px;">${t.message}</p>
    ${buildCtaButton(resetLink, t.resetButton)}
    <p style="color: #6b7280; line-height: 1.6; margin-bottom: 20px;">${t.ignoreMessage}</p>
    <p style="color: #6b7280; line-height: 1.6; margin-bottom: 20px;">${t.expiryMessage}</p>
  `;

  return {
    subject: t.subject,
    html: wrapBrandedEmail({
      bodyHtml,
      fallbackMessage: t.fallbackMessage,
      fallbackLink: resetLink,
      copyright: t.copyright,
    }),
    text: buildPlainTextEmail([
      t.subject,
      `${t.greeting} ${displayName}!`,
      t.message,
      resetLink,
      t.ignoreMessage,
      t.expiryMessage,
      t.copyright,
    ]),
  };
}

export function buildPasswordResetEmailContent(options: {
  resetUrl: string;
  greetingName?: string;
  locale?: string;
}): EmailTemplateContent {
  return passwordResetTemplate(options.resetUrl, options.greetingName ?? "", options.locale);
}
