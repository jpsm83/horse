/**
 * Ownership transfer invite email — en/es locales.
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

export type OwnershipTransferInviteTemplateInput = {
  invitedEmail: string;
  invitedName?: string;
  initiatorLabel: string;
  entityName: string;
  entityType: string;
  transferKind: string;
  acceptUrl: string;
  referralReference?: string;
  locale?: string;
  isExistingUser?: boolean;
};

const kindMessages: Record<
  EmailLocale,
  Record<string, { subject: string; body: string }>
> = {
  en: {
    transfer_main: {
      subject: "{initiatorLabel} invited you to take ownership of {entityName}",
      body: "{initiatorLabel} wants to transfer main ownership of {entityName} ({entityType}) to you on Equus. Accept to become the main owner, or decline if this was unexpected.",
    },
    remove_co_owner: {
      subject: "{initiatorLabel} requested to remove you as co-owner of {entityName}",
      body: "{initiatorLabel} asked to remove you as a co-owner of {entityName} ({entityType}) on Equus. Accept to confirm removal, or decline to keep your co-ownership.",
    },
    promote_co_owner: {
      subject: "{initiatorLabel} invited you to become main owner of {entityName}",
      body: "{initiatorLabel} wants to promote you from co-owner to main owner of {entityName} ({entityType}) on Equus. Accept to take main ownership, or decline.",
    },
    add_responsible: {
      subject: "{initiatorLabel} invited you as a responsible person for {entityName}",
      body: "{initiatorLabel} wants to add you as a responsible person for {entityName} ({entityType}) on Equus. Accept to confirm, or decline.",
    },
    remove_responsible: {
      subject: "{initiatorLabel} requested to remove you as responsible for {entityName}",
      body: "{initiatorLabel} asked to remove you as a responsible person for {entityName} ({entityType}) on Equus. Accept to confirm, or decline.",
    },
  },
  es: {
    transfer_main: {
      subject: "{initiatorLabel} te invitó a asumir la propiedad de {entityName}",
      body: "{initiatorLabel} quiere transferirte la propiedad principal de {entityName} ({entityType}) en Equus. Acepta para convertirte en propietario principal, o rechaza si no esperabas esto.",
    },
    remove_co_owner: {
      subject: "{initiatorLabel} pidió quitarte como copropietario de {entityName}",
      body: "{initiatorLabel} pidió eliminarte como copropietario de {entityName} ({entityType}) en Equus. Acepta para confirmar, o rechaza para mantener tu copropiedad.",
    },
    promote_co_owner: {
      subject: "{initiatorLabel} te invitó a ser propietario principal de {entityName}",
      body: "{initiatorLabel} quiere promoverte de copropietario a propietario principal de {entityName} ({entityType}) en Equus. Acepta o rechaza.",
    },
    add_responsible: {
      subject: "{initiatorLabel} te invitó como responsable de {entityName}",
      body: "{initiatorLabel} quiere añadirte como persona responsable de {entityName} ({entityType}) en Equus. Acepta o rechaza.",
    },
    remove_responsible: {
      subject: "{initiatorLabel} pidió quitarte como responsable de {entityName}",
      body: "{initiatorLabel} pidió eliminarte como persona responsable de {entityName} ({entityType}) en Equus. Acepta o rechaza.",
    },
  },
};

const shared = {
  en: {
    greeting: "Hello",
    referralLine: "Your referral reference: {referralReference}",
    acceptButtonNew: "Join Equus",
    acceptButtonExisting: "View invitation",
    ignoreMessage: "If you were not expecting this invitation, you can ignore this email.",
    fallbackMessage:
      "If the button above doesn't work, copy and paste this link into your browser:",
    copyright: "© 2026 Equus. All rights reserved.",
    fallbackSubject: "{initiatorLabel} sent you an ownership invitation for {entityName}",
    fallbackBody:
      "{initiatorLabel} sent you an ownership-related invitation for {entityName} ({entityType}) on Equus.",
  },
  es: {
    greeting: "Hola",
    referralLine: "Tu referencia de invitación: {referralReference}",
    acceptButtonNew: "Unirse a Equus",
    acceptButtonExisting: "Ver invitación",
    ignoreMessage: "Si no esperabas esta invitación, puedes ignorar este correo.",
    fallbackMessage: "Si el botón de arriba no funciona, copia y pega este enlace en tu navegador:",
    copyright: "© 2026 Equus. Todos los derechos reservados.",
    fallbackSubject: "{initiatorLabel} te envió una invitación de propiedad para {entityName}",
    fallbackBody:
      "{initiatorLabel} te envió una invitación relacionada con la propiedad de {entityName} ({entityType}) en Equus.",
  },
} satisfies Record<EmailLocale, Record<string, string>>;

function interpolate(template: string, values: Record<string, string>): string {
  return Object.entries(values).reduce(
    (result, [key, value]) => result.replaceAll(`{${key}}`, value),
    template,
  );
}

export function ownershipTransferInviteTemplate(
  input: OwnershipTransferInviteTemplateInput,
): EmailTemplateContent {
  const resolvedLocale = resolveEmailLocale(input.locale);
  const t = shared[resolvedLocale];
  const kind = kindMessages[resolvedLocale][input.transferKind] ?? {
    subject: t.fallbackSubject,
    body: t.fallbackBody,
  };
  const displayName = fallbackDisplayName(input.invitedName ?? input.invitedEmail.split("@")[0]);

  const values = {
    initiatorLabel: input.initiatorLabel,
    entityName: input.entityName,
    entityType: input.entityType,
    referralReference: input.referralReference ?? "",
  };

  const subject = interpolate(kind.subject, values);
  const message = interpolate(kind.body, values);
  const acceptButton = input.isExistingUser ? t.acceptButtonExisting : t.acceptButtonNew;
  const referralLine =
    !input.isExistingUser && input.referralReference
      ? interpolate(t.referralLine, values)
      : "";

  const bodyHtml = `
    <h2 style="${emailHeadingStyle()}">${t.greeting} ${displayName}!</h2>
    <p style="${emailBodyStyle()}">${message}</p>
    ${referralLine ? `<p style="${emailBodyStyle()}">${referralLine}</p>` : ""}
    ${buildCtaButton(input.acceptUrl, acceptButton)}
    <p style="${emailBodyStyle()}">${t.ignoreMessage}</p>
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
      ...(referralLine ? [referralLine] : []),
      input.acceptUrl,
      t.ignoreMessage,
      t.copyright,
    ]),
  };
}
