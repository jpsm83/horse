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
