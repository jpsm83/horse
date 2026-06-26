/**
 * Equus transactional email module — templates and Gmail transport.
 * Reference implementation: health project (AUTH_EMAIL_FLOW.md).
 */

export type { EmailLocale, EmailTemplateContent } from "./types.ts";
export {
  createEmailTransporter,
  getDefaultFromAddress,
  sendEmail,
  sendTemplateEmail,
  validateEmailConfig,
} from "./sendEmail.ts";
export {
  buildConfirmEmailLink,
  buildResetPasswordLink,
  buildRelationshipSignupLink,
  buildStaffInviteAcceptLink,
  buildStaffInviteSignupLink,
} from "./links.ts";
export {
  buildEmailConfirmationContent,
  emailConfirmationTemplate,
} from "./templates/emailConfirmation.ts";
export {
  buildPasswordResetEmailContent,
  passwordResetTemplate,
} from "./templates/passwordReset.ts";
export { staffInviteTemplate } from "./templates/staffInvite.ts";
export {
  relationshipInviteTemplate,
  type RelationshipInviteVariant,
} from "./templates/relationshipInvite.ts";
export { sendStaffInviteEmail } from "./sendStaffInviteEmail.ts";
export { sendRelationshipInviteEmail } from "./sendRelationshipInviteEmail.ts";
