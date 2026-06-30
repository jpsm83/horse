/**
 * Sends relationship invite email after a pending Relationship is created.
 * Called from relationshipService.createRelationshipInvite.
 */

import {
  buildRelationshipAcceptLink,
  buildRelationshipSignupLink,
} from "./links.ts";
import { sendTemplateEmail } from "./sendEmail.ts";
import {
  relationshipInviteTemplate,
  type RelationshipInviteVariant,
} from "./templates/relationshipInvite.ts";

export type SendRelationshipInviteEmailInput = {
  relationshipId: string;
  invitedEmail: string;
  invitedName?: string;
  horseName: string;
  relationshipType: string;
  requesterLabel: string;
  referralReference: string;
  locale?: string;
  inviteeUserId?: string;
  variant: RelationshipInviteVariant;
};

export async function sendRelationshipInviteEmail(
  input: SendRelationshipInviteEmailInput,
): Promise<void> {
  const isExistingUser = Boolean(input.inviteeUserId);
  const locale = input.locale;
  const acceptUrl = isExistingUser
    ? buildRelationshipAcceptLink(input.relationshipId, locale)
    : buildRelationshipSignupLink(input.referralReference, locale);

  const content = relationshipInviteTemplate({
    invitedEmail: input.invitedEmail,
    invitedName: input.invitedName,
    horseName: input.horseName,
    relationshipType: input.relationshipType,
    requesterLabel: input.requesterLabel,
    referralReference: input.referralReference,
    acceptUrl,
    locale: input.locale,
    variant: input.variant,
    isExistingUser,
  });

  await sendTemplateEmail({ to: input.invitedEmail, content });
}
