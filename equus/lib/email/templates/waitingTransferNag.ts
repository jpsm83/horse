/**
 * Waiting-transfer nag email — en/es locales for 3-day reminder cycle.
 */

import {
  buildCtaButton,
  buildPlainTextEmail,
  emailBodyStyle,
  emailHeadingStyle,
  wrapBrandedEmail,
} from "../layout.ts";
import { fallbackDisplayName, resolveEmailLocale } from "../locales.ts";
import type { EmailLocale, EmailTemplateContent } from "../types.ts";

export type WaitingTransferNagRole = "provisional_owner" | "invited_owner";

export type WaitingTransferNagTemplateInput = {
  to: string;
  horseName: string;
  actionUrl: string;
  role: WaitingTransferNagRole;
  locale?: string;
};

const messages: Record<
  EmailLocale,
  Record<WaitingTransferNagRole, { subject: string; body: string; button: string }>
> = {
  en: {
    provisional_owner: {
      subject: "Ownership transfer pending for {horseName}",
      body: "You created {horseName} on behalf of another owner. The real owner has not claimed the horse yet. Open Connect to review the pending transfer.",
      button: "Open Connect",
    },
    invited_owner: {
      subject: "You have been invited to own {horseName}",
      body: "A stable created {horseName} and invited you to become the main owner on Equus. Accept the ownership transfer to claim the horse.",
      button: "View ownership transfer",
    },
  },
  es: {
    provisional_owner: {
      subject: "Transferencia de propiedad pendiente para {horseName}",
      body: "Creaste {horseName} en nombre de otro propietario. El propietario real aún no ha reclamado el caballo. Abre Connect para revisar la transferencia pendiente.",
      button: "Abrir Connect",
    },
    invited_owner: {
      subject: "Te invitaron a ser propietario de {horseName}",
      body: "Un establo creó {horseName} y te invitó a ser el propietario principal en Equus. Acepta la transferencia de propiedad para reclamar el caballo.",
      button: "Ver transferencia de propiedad",
    },
  },
};

const shared = {
  en: {
    greeting: "Hello",
    ignoreMessage: "If this was unexpected, you can ignore this email.",
    fallbackMessage:
      "If the button above doesn't work, copy and paste this link into your browser:",
    copyright: "© 2026 Equus. All rights reserved.",
  },
  es: {
    greeting: "Hola",
    ignoreMessage: "Si no esperabas este mensaje, puedes ignorar este correo.",
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

export function waitingTransferNagTemplate(
  input: WaitingTransferNagTemplateInput,
): EmailTemplateContent {
  const resolvedLocale = resolveEmailLocale(input.locale);
  const t = shared[resolvedLocale];
  const roleCopy = messages[resolvedLocale][input.role];
  const displayName = fallbackDisplayName(input.to.split("@")[0] ?? "there");
  const values = { horseName: input.horseName };

  const subject = interpolate(roleCopy.subject, values);
  const message = interpolate(roleCopy.body, values);

  const bodyHtml = `
    <p style="${emailBodyStyle}">${t.greeting} ${displayName},</p>
    <p style="${emailBodyStyle}">${message}</p>
    ${buildCtaButton(roleCopy.button, input.actionUrl)}
    <p style="${emailBodyStyle}">${t.ignoreMessage}</p>
    <p style="${emailBodyStyle}">${t.fallbackMessage}</p>
    <p style="${emailBodyStyle}"><a href="${input.actionUrl}">${input.actionUrl}</a></p>
  `;

  return {
    subject,
    html: wrapBrandedEmail({
      heading: interpolate(roleCopy.subject, values),
      headingStyle: emailHeadingStyle,
      bodyHtml,
      copyright: t.copyright,
    }),
    text: buildPlainTextEmail({
      greeting: `${t.greeting} ${displayName},`,
      paragraphs: [message, t.ignoreMessage, input.actionUrl],
      copyright: t.copyright,
    }),
  };
}
