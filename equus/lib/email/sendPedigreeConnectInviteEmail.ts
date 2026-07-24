/**
 * Sends pedigree connection invite email after a pending PedigreeConnection is created.
 */

import {
  buildPedigreeConnectAcceptLink,
  buildPedigreeConnectSignupLink,
} from "./links.ts";
import { sendTemplateEmail } from "./sendEmail.ts";
import { pedigreeConnectInviteTemplate } from "./templates/pedigreeConnectInvite.ts";

export type SendPedigreeConnectInviteEmailInput = {
  connectionId: string;
  invitedEmail: string;
  invitedName?: string;
  referralReference: string;
  locale?: string;
  inviteeUserId?: string;
  initiatorLabel: string;
  role: "sire" | "dam";
  parentHorseName: string;
  parentRegistryId?: string;
  parentMicrochipId?: string;
  parentPassportNumber?: string;
  childHorseName: string;
  childBreed?: string;
  childSex?: string;
  childDateOfBirth?: Date;
  childRegistryId?: string;
  childMicrochipId?: string;
  childPassportNumber?: string;
};

function identityLine(parts: Array<string | undefined>): string | undefined {
  const filtered = parts.filter(Boolean) as string[];
  return filtered.length > 0 ? filtered.join(" · ") : undefined;
}

export async function sendPedigreeConnectInviteEmail(
  input: SendPedigreeConnectInviteEmailInput,
): Promise<void> {
  const isExistingUser = Boolean(input.inviteeUserId);
  const locale = input.locale;
  const acceptUrl = isExistingUser
    ? buildPedigreeConnectAcceptLink(input.connectionId, locale)
    : buildPedigreeConnectSignupLink(input.referralReference, locale);

  const parentIdentityLine = identityLine([
    input.parentRegistryId ? `registry ${input.parentRegistryId}` : undefined,
    input.parentMicrochipId ? `microchip ${input.parentMicrochipId}` : undefined,
    input.parentPassportNumber ? `passport ${input.parentPassportNumber}` : undefined,
  ]);

  const childDob =
    input.childDateOfBirth instanceof Date && !Number.isNaN(input.childDateOfBirth.getTime())
      ? input.childDateOfBirth.toISOString().slice(0, 10)
      : undefined;

  const childDetailsLine = identityLine([
    input.childBreed,
    input.childSex,
    childDob,
    input.childRegistryId ? `registry ${input.childRegistryId}` : undefined,
    input.childMicrochipId ? `microchip ${input.childMicrochipId}` : undefined,
    input.childPassportNumber ? `passport ${input.childPassportNumber}` : undefined,
  ]);

  const content = pedigreeConnectInviteTemplate({
    invitedEmail: input.invitedEmail,
    invitedName: input.invitedName,
    initiatorLabel: input.initiatorLabel,
    role: input.role,
    parentHorseName: input.parentHorseName,
    parentIdentityLine,
    childHorseName: input.childHorseName,
    childDetailsLine,
    acceptUrl,
    referralReference: input.referralReference,
    locale: input.locale,
    isExistingUser,
  });

  await sendTemplateEmail({ to: input.invitedEmail, content });
}
