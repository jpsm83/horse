/**
 * Email confirmation template — en/es locales.
 */

import { buildCtaButton, buildPlainTextEmail, wrapBrandedEmail } from "../layout.ts";
import { fallbackDisplayName, resolveEmailLocale } from "../locales.ts";
import type { EmailLocale, EmailTemplateContent } from "../types.ts";

const emailTranslations = {
  en: {
    subject: "Confirm Your Email - Equus",
    greeting: "Hello",
    message:
      "Welcome to Equus! Please confirm your email address by clicking the button below to complete your account setup.",
    confirmButton: "Confirm Email",
    ignoreMessage: "If you didn't create an account with Equus, please ignore this email.",
    expiryMessage: "This confirmation link will expire in 24 hours for security reasons.",
    fallbackMessage:
      "If the button above doesn't work, copy and paste this link into your browser:",
    copyright: "© 2026 Equus. All rights reserved.",
  },
  es: {
    subject: "Confirma tu Email - Equus",
    greeting: "Hola",
    message:
      "¡Bienvenido a Equus! Confirma tu dirección de email haciendo clic en el botón de abajo para completar la configuración de tu cuenta.",
    confirmButton: "Confirmar Email",
    ignoreMessage: "Si no creaste una cuenta en Equus, ignora este email.",
    expiryMessage: "Este enlace de confirmación expirará en 24 horas por razones de seguridad.",
    fallbackMessage: "Si el botón de arriba no funciona, copia y pega este enlace en tu navegador:",
    copyright: "© 2026 Equus. Todos los derechos reservados.",
  },
} satisfies Record<EmailLocale, Record<string, string>>;

export function emailConfirmationTemplate(
  confirmLink: string,
  username: string,
  locale?: string,
): EmailTemplateContent {
  const resolvedLocale = resolveEmailLocale(locale);
  const t = emailTranslations[resolvedLocale];
  const displayName = fallbackDisplayName(username);

  const bodyHtml = `
    <h2 style="color: #374151; margin-bottom: 20px;">${t.greeting} ${displayName}!</h2>
    <p style="color: #6b7280; line-height: 1.6; margin-bottom: 20px;">${t.message}</p>
    ${buildCtaButton(confirmLink, t.confirmButton)}
    <p style="color: #6b7280; line-height: 1.6; margin-bottom: 20px;">${t.ignoreMessage}</p>
    <p style="color: #6b7280; line-height: 1.6; margin-bottom: 20px;">${t.expiryMessage}</p>
  `;

  return {
    subject: t.subject,
    html: wrapBrandedEmail({
      bodyHtml,
      fallbackMessage: t.fallbackMessage,
      fallbackLink: confirmLink,
      copyright: t.copyright,
    }),
    text: buildPlainTextEmail([
      t.subject,
      `${t.greeting} ${displayName}!`,
      t.message,
      confirmLink,
      t.ignoreMessage,
      t.expiryMessage,
      t.copyright,
    ]),
  };
}

export function buildEmailConfirmationContent(options: {
  confirmUrl: string;
  greetingName?: string;
  locale?: string;
}): EmailTemplateContent {
  return emailConfirmationTemplate(
    options.confirmUrl,
    options.greetingName ?? "",
    options.locale,
  );
}
