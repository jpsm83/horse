/**
 * Pedigree connect invite email — en/es locales.
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

export type PedigreeConnectInviteTemplateInput = {
  invitedEmail: string;
  invitedName?: string;
  initiatorLabel: string;
  role: "sire" | "dam";
  parentHorseName: string;
  parentIdentityLine?: string;
  childHorseName: string;
  childDetailsLine?: string;
  acceptUrl: string;
  referralReference?: string;
  locale?: string;
  isExistingUser?: boolean;
};

const emailTranslations = {
  en: {
    subject: "{initiatorLabel} asks you to confirm {parentHorseName} as {roleLabel}",
    greeting: "Hello",
    roleSire: "sire (father)",
    roleDam: "dam (mother)",
    messageNew:
      "{initiatorLabel} wants to link their horse {childHorseName} as the offspring of {parentHorseName} on Equus. They are asking you to acknowledge that {parentHorseName} is the {roleLabel}. This does not transfer ownership — it only confirms the pedigree relationship.",
    messageExisting:
      "{initiatorLabel} wants to link their horse {childHorseName} as the offspring of {parentHorseName} on Equus. They are asking you to acknowledge that {parentHorseName} is the {roleLabel}. This does not transfer ownership — it only confirms the pedigree relationship. Sign in to accept or decline.",
    parentLine: "Parent horse: {parentHorseName}{parentIdentity}",
    childLine: "Their horse: {childHorseName}{childDetails}",
    referralLine: "Your referral reference: {referralReference}",
    acceptButtonNew: "Join Equus",
    acceptButtonExisting: "View invitation",
    ignoreMessage: "If you were not expecting this invitation, you can ignore this email.",
    fallbackMessage:
      "If the button above doesn't work, copy and paste this link into your browser:",
    copyright: "© 2026 Equus. All rights reserved.",
  },
  es: {
    subject: "{initiatorLabel} te pide confirmar a {parentHorseName} como {roleLabel}",
    greeting: "Hola",
    roleSire: "padre",
    roleDam: "madre",
    messageNew:
      "{initiatorLabel} quiere vincular su caballo {childHorseName} como cría de {parentHorseName} en Equus. Te pide que reconozcas que {parentHorseName} es el/la {roleLabel}. Esto no transfiere la propiedad: solo confirma la relación genealógica.",
    messageExisting:
      "{initiatorLabel} quiere vincular su caballo {childHorseName} como cría de {parentHorseName} en Equus. Te pide que reconozcas que {parentHorseName} es el/la {roleLabel}. Esto no transfiere la propiedad: solo confirma la relación genealógica. Inicia sesión para aceptar o rechazar.",
    parentLine: "Caballo padre/madre: {parentHorseName}{parentIdentity}",
    childLine: "Su caballo: {childHorseName}{childDetails}",
    referralLine: "Tu referencia de invitación: {referralReference}",
    acceptButtonNew: "Unirse a Equus",
    acceptButtonExisting: "Ver invitación",
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

export function pedigreeConnectInviteTemplate(
  input: PedigreeConnectInviteTemplateInput,
): EmailTemplateContent {
  const resolvedLocale = resolveEmailLocale(input.locale);
  const t = emailTranslations[resolvedLocale];
  const displayName = fallbackDisplayName(input.invitedName ?? input.invitedEmail.split("@")[0]);
  const roleLabel = input.role === "sire" ? t.roleSire : t.roleDam;

  const values = {
    initiatorLabel: input.initiatorLabel,
    parentHorseName: input.parentHorseName,
    childHorseName: input.childHorseName,
    roleLabel,
    parentIdentity: input.parentIdentityLine ? ` (${input.parentIdentityLine})` : "",
    childDetails: input.childDetailsLine ? ` (${input.childDetailsLine})` : "",
    referralReference: input.referralReference ?? "",
  };

  const subject = interpolate(t.subject, values);
  const message = interpolate(
    input.isExistingUser ? t.messageExisting : t.messageNew,
    values,
  );
  const parentLine = interpolate(t.parentLine, values);
  const childLine = interpolate(t.childLine, values);
  const acceptButton = input.isExistingUser ? t.acceptButtonExisting : t.acceptButtonNew;
  const referralLine =
    !input.isExistingUser && input.referralReference
      ? interpolate(t.referralLine, values)
      : "";

  const bodyHtml = `
    <h2 style="${emailHeadingStyle()}">${t.greeting} ${displayName}!</h2>
    <p style="${emailBodyStyle()}">${message}</p>
    <p style="${emailBodyStyle()}">${parentLine}</p>
    <p style="${emailBodyStyle()}">${childLine}</p>
    ${referralLine ? `<p style="${emailBodyStyle()}">${referralLine}</p>` : ""}
    ${buildCtaButton(input.acceptUrl, acceptButton)}
    <p style="${emailBodyStyle()}">${t.ignoreMessage}</p>
  `;

  const textParts = [
    subject,
    `${t.greeting} ${displayName}!`,
    message,
    parentLine,
    childLine,
    ...(referralLine ? [referralLine] : []),
    input.acceptUrl,
    t.ignoreMessage,
    t.copyright,
  ];

  return {
    subject,
    html: wrapBrandedEmail({
      bodyHtml,
      fallbackMessage: t.fallbackMessage,
      fallbackLink: input.acceptUrl,
      copyright: t.copyright,
    }),
    text: buildPlainTextEmail(textParts),
  };
}
