/**
 * Relationship invite email — en/es locales.
 */

import { buildCtaButton, buildPlainTextEmail, wrapBrandedEmail } from "../layout.ts";
import { fallbackDisplayName, resolveEmailLocale } from "../locales.ts";
import type { EmailLocale, EmailTemplateContent } from "../types.ts";

export type RelationshipInviteVariant =
  | "vetAddedHorse"
  | "ownerInvitesVet"
  | "ownerInvitesProvider";

export type RelationshipInviteTemplateInput = {
  invitedEmail: string;
  invitedName?: string;
  horseName: string;
  relationshipType: string;
  requesterLabel: string;
  referralReference: string;
  acceptUrl: string;
  locale?: string;
  variant: RelationshipInviteVariant;
  isExistingUser?: boolean;
};

const emailTranslations = {
  en: {
    subjectVetAddedHorse: "{requesterLabel} added {horseName} on Equus",
    subjectOwnerInvitesVet: "{requesterLabel} wants to connect as vet for {horseName}",
    subjectOwnerInvitesProvider:
      "{requesterLabel} invited you to connect for {horseName} on Equus",
    greeting: "Hello",
    messageVetAddedHorse:
      "Your vet {requesterLabel} added {horseName} on Equus. Sign up to connect and manage your horse's health, training, and more.",
    messageOwnerInvitesVet:
      "A horse owner invited you to connect as their vet for {horseName} on Equus. Sign up to accept the relationship.",
    messageOwnerInvitesProviderNew:
      "{requesterLabel} invited you to connect as their {relationshipType} for {horseName} on Equus. Create your account to accept the relationship.",
    messageOwnerInvitesProviderExisting:
      "{requesterLabel} invited you to connect as their {relationshipType} for {horseName} on Equus. Sign in to accept the relationship.",
    referralLine: "Your referral reference: {referralReference}",
    acceptButtonNew: "Join Equus",
    acceptButtonExisting: "View invitation",
    ignoreMessage: "If you were not expecting this invitation, you can ignore this email.",
    fallbackMessage:
      "If the button above doesn't work, copy and paste this link into your browser:",
    copyright: "© 2026 Equus. All rights reserved.",
  },
  es: {
    subjectVetAddedHorse: "{requesterLabel} añadió {horseName} en Equus",
    subjectOwnerInvitesVet: "{requesterLabel} quiere conectarse como veterinario de {horseName}",
    subjectOwnerInvitesProvider:
      "{requesterLabel} te invitó a conectarte por {horseName} en Equus",
    greeting: "Hola",
    messageVetAddedHorse:
      "Tu veterinario {requesterLabel} añadió {horseName} en Equus. Regístrate para gestionar la salud, entrenamiento y más de tu caballo.",
    messageOwnerInvitesVet:
      "Un propietario te invitó a conectarte como veterinario de {horseName} en Equus. Regístrate para aceptar la relación.",
    messageOwnerInvitesProviderNew:
      "{requesterLabel} te invitó a conectarte como {relationshipType} de {horseName} en Equus. Crea tu cuenta para aceptar la relación.",
    messageOwnerInvitesProviderExisting:
      "{requesterLabel} te invitó a conectarte como {relationshipType} de {horseName} en Equus. Inicia sesión para aceptar la relación.",
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

  let subject: string;
  let message: string;
  let acceptButton: string;
  let includeReferralLine = true;

  if (input.variant === "vetAddedHorse") {
    subject = interpolate(t.subjectVetAddedHorse, values);
    message = interpolate(t.messageVetAddedHorse, values);
    acceptButton = t.acceptButtonNew;
  } else if (input.variant === "ownerInvitesVet") {
    subject = interpolate(t.subjectOwnerInvitesVet, values);
    message = interpolate(t.messageOwnerInvitesVet, values);
    acceptButton = t.acceptButtonNew;
  } else {
    subject = interpolate(t.subjectOwnerInvitesProvider, values);
    message = interpolate(
      input.isExistingUser
        ? t.messageOwnerInvitesProviderExisting
        : t.messageOwnerInvitesProviderNew,
      values,
    );
    acceptButton = input.isExistingUser ? t.acceptButtonExisting : t.acceptButtonNew;
    includeReferralLine = !input.isExistingUser;
  }

  const referralLine = includeReferralLine ? interpolate(t.referralLine, values) : "";

  const bodyHtml = `
    <h2 style="color: #374151; margin-bottom: 20px;">${t.greeting} ${displayName}!</h2>
    <p style="color: #6b7280; line-height: 1.6; margin-bottom: 20px;">${message}</p>
    ${referralLine ? `<p style="color: #6b7280; line-height: 1.6; margin-bottom: 20px;">${referralLine}</p>` : ""}
    ${buildCtaButton(input.acceptUrl, acceptButton)}
    <p style="color: #6b7280; line-height: 1.6; margin-bottom: 20px;">${t.ignoreMessage}</p>
  `;

  const textParts = [
    subject,
    `${t.greeting} ${displayName}!`,
    message,
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
