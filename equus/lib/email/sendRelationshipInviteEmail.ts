/**
 * Sends relationship invite email to a non-registered party.
 * Stub for future relationshipService — export ready for when invites are created.
 */

import { buildRelationshipSignupLink } from "./links.ts";
import { sendTemplateEmail } from "./sendEmail.ts";
import {
  relationshipInviteTemplate,
  type RelationshipInviteVariant,
} from "./templates/relationshipInvite.ts";

export type SendRelationshipInviteEmailInput = {
  invitedEmail: string;
  invitedName?: string;
  horseName: string;
  relationshipType: string;
  requesterLabel: string;
  referralReference: string;
  locale?: string;
  variant: RelationshipInviteVariant;
};

export async function sendRelationshipInviteEmail(
  input: SendRelationshipInviteEmailInput,
): Promise<void> {
  const signupUrl = buildRelationshipSignupLink(input.referralReference);

  const content = relationshipInviteTemplate({
    invitedEmail: input.invitedEmail,
    invitedName: input.invitedName,
    horseName: input.horseName,
    relationshipType: input.relationshipType,
    requesterLabel: input.requesterLabel,
    referralReference: input.referralReference,
    signupUrl,
    locale: input.locale,
    variant: input.variant,
  });

  await sendTemplateEmail({ to: input.invitedEmail, content });
}
