/**
 * Staff invite email template — en/es locales.
 */

import { buildCtaButton, buildPlainTextEmail, wrapBrandedEmail } from "../layout.ts";
import { fallbackDisplayName, resolveEmailLocale } from "../locales.ts";
import type { EmailLocale, EmailTemplateContent } from "../types.ts";

export type StaffInviteTemplateInput = {
  invitedEmail: string;
  profileName: string;
  roleTypeLabel: string;
  staffRole: string;
  inviterName: string;
  acceptUrl: string;
  locale?: string;
  isExistingUser?: boolean;
};

const emailTranslations = {
  en: {
    subject: "You're invited to join {profileName} on Equus",
    greeting: "Hello",
    messageExisting:
      "{inviterName} invited you to join {profileName} ({roleTypeLabel}) as {staffRole}. Sign in to accept the invitation.",
    messageNew:
      "{inviterName} invited you to join {profileName} ({roleTypeLabel}) as {staffRole}. Create your Equus account to get started.",
    acceptButton: "View invitation",
    ignoreMessage: "If you were not expecting this invitation, you can ignore this email.",
    fallbackMessage:
      "If the button above doesn't work, copy and paste this link into your browser:",
    copyright: "© 2026 Equus. All rights reserved.",
  },
  es: {
    subject: "Estás invitado a unirte a {profileName} en Equus",
    greeting: "Hola",
    messageExisting:
      "{inviterName} te invitó a {profileName} ({roleTypeLabel}) como {staffRole}. Inicia sesión para aceptar la invitación.",
    messageNew:
      "{inviterName} te invitó a {profileName} ({roleTypeLabel}) como {staffRole}. Crea tu cuenta Equus para comenzar.",
    acceptButton: "Ver invitación",
    ignoreMessage: "Si no esperabas esta invitación, puedes ignorar este correo.",
    fallbackMessage: "Si el botón de arriba no funciona, copia y pega este enlace en tu navegador:",
    copyright: "© 2026 Equus. Todos los derechos reservados.",
  },
} satisfies Record<EmailLocale, Record<string, string>>;

function interpolate(template: string, values: Record<string, string>): string {
  return Object.entries(values).reduce(
    (result, [key, value]) => result.replaceAll(`{${key}}`, value),
    template,
  );
}

export function staffInviteTemplate(input: StaffInviteTemplateInput): EmailTemplateContent {
  const resolvedLocale = resolveEmailLocale(input.locale);
  const t = emailTranslations[resolvedLocale];
  const displayName = fallbackDisplayName(input.invitedEmail.split("@")[0]);

  const values = {
    profileName: input.profileName,
    roleTypeLabel: input.roleTypeLabel,
    staffRole: input.staffRole,
    inviterName: input.inviterName,
  };

  const message = interpolate(
    input.isExistingUser ? t.messageExisting : t.messageNew,
    values,
  );
  const subject = interpolate(t.subject, values);

  const bodyHtml = `
    <h2 style="color: #374151; margin-bottom: 20px;">${t.greeting} ${displayName}!</h2>
    <p style="color: #6b7280; line-height: 1.6; margin-bottom: 20px;">${message}</p>
    ${buildCtaButton(input.acceptUrl, t.acceptButton)}
    <p style="color: #6b7280; line-height: 1.6; margin-bottom: 20px;">${t.ignoreMessage}</p>
  `;

  return {
    subject,
    html: wrapBrandedEmail({
      bodyHtml,
      fallbackMessage: t.fallbackMessage,
      fallbackLink: input.acceptUrl,
      copyright: t.copyright,
    }),
    text: buildPlainTextEmail([
      subject,
      `${t.greeting} ${displayName}!`,
      message,
      input.acceptUrl,
      t.ignoreMessage,
      t.copyright,
    ]),
  };
}
