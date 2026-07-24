/**
 * URL builders for links embedded in Equus transactional emails.
 */

import {
  buildConfirmEmailLink,
  buildResetPasswordLink,
} from "@/lib/auth/emailLinks.ts";
import { buildLocalizedAppLink } from "@/i18n/appLinks.ts";

export { buildConfirmEmailLink, buildResetPasswordLink };

/** Signup URL with staff membership ref for invitees without an account. */
export function buildStaffInviteSignupLink(membershipId: string, locale?: string): string {
  return buildLocalizedAppLink(locale, "signup", { ref: membershipId });
}

/** App workplaces view for existing users to accept a pending staff invite. */
export function buildStaffInviteAcceptLink(membershipId: string, locale?: string): string {
  return buildLocalizedAppLink(locale, "workplaces", { membership: membershipId });
}

/** Relationship invite signup with referral attribution. */
export function buildRelationshipSignupLink(referralReference: string, locale?: string): string {
  return buildLocalizedAppLink(locale, "signup", { ref: referralReference });
}

/** App relationships view for existing users to accept a pending horse relationship invite. */
export function buildRelationshipAcceptLink(relationshipId: string, locale?: string): string {
  return buildLocalizedAppLink(locale, "relationships", { relationship: relationshipId });
}

/** Pedigree connection signup with referral attribution. */
export function buildPedigreeConnectSignupLink(referralReference: string, locale?: string): string {
  return buildLocalizedAppLink(locale, "signup", { ref: referralReference });
}

/** App pedigree connections inbox for existing users. */
export function buildPedigreeConnectAcceptLink(connectionId: string, locale?: string): string {
  return buildLocalizedAppLink(locale, "pedigree-connections", { connection: connectionId });
}

/** Ownership transfer signup with referral attribution. */
export function buildOwnershipTransferSignupLink(referralReference: string, locale?: string): string {
  return buildLocalizedAppLink(locale, "signup", { ref: referralReference });
}

/** App ownership transfers inbox for existing users. */
export function buildOwnershipTransferAcceptLink(transferId: string, locale?: string): string {
  return buildLocalizedAppLink(locale, "ownership-transfers", { transfer: transferId });
}
