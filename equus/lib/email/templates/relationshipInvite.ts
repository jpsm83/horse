/**
 * Relationship invite email — en/es locales.
 */

import { buildCtaButton, buildPlainTextEmail, wrapBrandedEmail } from "../layout.ts";
import { fallbackDisplayName, resolveEmailLocale } from "../locales.ts";
import type { EmailLocale, EmailTemplateContent } from "../types.ts";

export type RelationshipInviteVariant = "vetAddedHorse" | "ownerInvitesVet";

export type RelationshipInviteTemplateInput = {
  invitedEmail: string;
  invitedName?: string;
  horseName: string;
  relationshipType: string;
  requesterLabel: string;
  referralReference: string;
  signupUrl: string;
  locale?: string;
  variant: RelationshipInviteVariant;
};

const emailTranslations = {
  en: {
    subjectVetAddedHorse: "{requesterLabel} added {horseName} on Equus",
    subjectOwnerInvitesVet: "{requesterLabel} wants to connect as vet for {horseName}",
    greeting: "Hello",
    messageVetAddedHorse:
      "Your vet {requesterLabel} added {horseName} on Equus. Sign up to connect and manage your horse's health, training, and more.",
    messageOwnerInvitesVet:
      "A horse owner invited you to connect as their vet for {horseName} on Equus. Sign up to accept the relationship.",
    referralLine: "Your referral reference: {referralReference}",
    signupButton: "Join Equus",
    ignoreMessage: "If you were not expecting this invitation, you can ignore this email.",
    fallbackMessage:
      "If the button above doesn't work, copy and paste this link into your browser:",
    copyright: "© 2026 Equus. All rights reserved.",
  },
  es: {
    subjectVetAddedHorse: "{requesterLabel} añadió {horseName} en Equus",
    subjectOwnerInvitesVet: "{requesterLabel} quiere conectarse como veterinario de {horseName}",
    greeting: "Hola",
    messageVetAddedHorse:
      "Tu veterinario {requesterLabel} añadió {horseName} en Equus. Regístrate para gestionar la salud, entrenamiento y más de tu caballo.",
    messageOwnerInvitesVet:
      "Un propietario te invitó a conectarte como veterinario de {horseName} en Equus. Regístrate para aceptar la relación.",
    referralLine: "Tu referencia de invitación: {referralReference}",
    signupButton: "Unirse a Equus",
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

export function relationshipInviteTemplate(
  input: RelationshipInviteTemplateInput,
): EmailTemplateContent {
  const resolvedLocale = resolveEmailLocale(input.locale);
  const t = emailTranslations[resolvedLocale];
  const displayName = fallbackDisplayName(input.invitedName ?? input.invitedEmail.split("@")[0]);

  const values = {
    horseName: input.horseName,
    requesterLabel: input.requesterLabel,
    referralReference: input.referralReference,
    relationshipType: input.relationshipType,
  };

  const isVetAddedHorse = input.variant === "vetAddedHorse";
  const subject = interpolate(
    isVetAddedHorse ? t.subjectVetAddedHorse : t.subjectOwnerInvitesVet,
    values,
  );
  const message = interpolate(
    isVetAddedHorse ? t.messageVetAddedHorse : t.messageOwnerInvitesVet,
    values,
  );
  const referralLine = interpolate(t.referralLine, values);

  const bodyHtml = `
    <h2 style="color: #374151; margin-bottom: 20px;">${t.greeting} ${displayName}!</h2>
    <p style="color: #6b7280; line-height: 1.6; margin-bottom: 20px;">${message}</p>
    <p style="color: #6b7280; line-height: 1.6; margin-bottom: 20px;">${referralLine}</p>
    ${buildCtaButton(input.signupUrl, t.signupButton)}
    <p style="color: #6b7280; line-height: 1.6; margin-bottom: 20px;">${t.ignoreMessage}</p>
  `;

  return {
    subject,
    html: wrapBrandedEmail({
      bodyHtml,
      fallbackMessage: t.fallbackMessage,
      fallbackLink: input.signupUrl,
      copyright: t.copyright,
    }),
    text: buildPlainTextEmail([
      subject,
      `${t.greeting} ${displayName}!`,
      message,
      referralLine,
      input.signupUrl,
      t.ignoreMessage,
      t.copyright,
    ]),
  };
}
