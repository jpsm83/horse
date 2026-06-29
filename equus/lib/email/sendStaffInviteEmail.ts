/**
 * Sends collaboration invite email after WorkplaceRelationship is created.
 * Called from workplaceRelationshipService.inviteCollaborator.
 */

import User from "@/models/User.ts";
import { sendTemplateEmail } from "./sendEmail.ts";
import {
  buildStaffInviteAcceptLink,
  buildStaffInviteSignupLink,
} from "./links.ts";
import { staffInviteTemplate } from "./templates/staffInvite.ts";
import type { BusinessRoleType } from "@/lib/roleProfiles/businessRoleProfile.ts";

const ROLE_TYPE_LABELS: Record<BusinessRoleType, string> = {
  stable: "Stable",
  breeder: "Breeder",
  ridingClub: "Riding Club",
  transport: "Transport",
};

export type SendStaffInviteEmailInput = {
  membershipId: string;
  invitedEmail: string;
  profileName: string;
  roleType: BusinessRoleType;
  staffRole: string;
  invitedByUserId: string;
  inviteeUserId?: string;
  locale?: string;
};

export async function sendStaffInviteEmail(input: SendStaffInviteEmailInput): Promise<void> {
  const inviter = await User.findById(input.invitedByUserId)
    .select("personalDetails.firstName personalDetails.lastName personalDetails.username")
    .lean();

  const pd = inviter?.personalDetails as
    | { firstName?: string; lastName?: string; username?: string }
    | undefined;
  const inviterName =
    [pd?.firstName, pd?.lastName].filter(Boolean).join(" ").trim() ||
    pd?.username?.trim() ||
    "A team member";

  const isExistingUser = Boolean(input.inviteeUserId);
  const locale = input.locale;
  const acceptUrl = isExistingUser
    ? buildStaffInviteAcceptLink(input.membershipId, locale)
    : buildStaffInviteSignupLink(input.membershipId, locale);

  const content = staffInviteTemplate({
    invitedEmail: input.invitedEmail,
    profileName: input.profileName,
    roleTypeLabel: ROLE_TYPE_LABELS[input.roleType],
    staffRole: input.staffRole,
    inviterName,
    acceptUrl,
    locale: input.locale,
    isExistingUser,
  });

  await sendTemplateEmail({ to: input.invitedEmail, content });
}
