/**
 * Sends ownership transfer invite email after a pending OwnershipTransfer is created.
 */

import {
  buildOwnershipTransferAcceptLink,
  buildOwnershipTransferSignupLink,
} from "./links.ts";
import { sendTemplateEmail } from "./sendEmail.ts";
import { ownershipTransferInviteTemplate } from "./templates/ownershipTransferInvite.ts";

export type SendOwnershipTransferInviteEmailInput = {
  transferId: string;
  invitedEmail: string;
  invitedName?: string;
  referralReference?: string;
  locale?: string;
  inviteeUserId?: string;
  initiatorLabel: string;
  entityName: string;
  entityType: string;
  transferKind: string;
};

export async function sendOwnershipTransferInviteEmail(
  input: SendOwnershipTransferInviteEmailInput,
): Promise<void> {
  const isExistingUser = Boolean(input.inviteeUserId);
  const locale = input.locale;
  const acceptUrl = isExistingUser
    ? buildOwnershipTransferAcceptLink(input.transferId, locale)
    : buildOwnershipTransferSignupLink(input.referralReference ?? input.transferId, locale);

  const content = ownershipTransferInviteTemplate({
    invitedEmail: input.invitedEmail,
    invitedName: input.invitedName,
    initiatorLabel: input.initiatorLabel,
    entityName: input.entityName,
    entityType: input.entityType,
    transferKind: input.transferKind,
    acceptUrl,
    referralReference: input.referralReference,
    locale: input.locale,
    isExistingUser,
  });

  await sendTemplateEmail({ to: input.invitedEmail, content });
}
