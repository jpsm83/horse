/**
 * Sends waiting-transfer reminder email to provisional owner or invited owner.
 */

import { buildLocalizedAppLink } from "@/i18n/appLinks.ts";
import { sendTemplateEmail } from "./sendEmail.ts";
import {
  waitingTransferNagTemplate,
  type WaitingTransferNagRole,
} from "./templates/waitingTransferNag.ts";

export type SendWaitingTransferNagEmailInput = {
  locale?: string;
  to: string;
  horseName: string;
  horseId: string;
  role: WaitingTransferNagRole;
  ownershipTransferId?: string;
};

export async function sendWaitingTransferNagEmail(
  input: SendWaitingTransferNagEmailInput,
): Promise<void> {
  const actionUrl =
    input.role === "invited_owner"
      ? buildLocalizedAppLink(input.locale, "ownership-transfers", {
          ...(input.ownershipTransferId ? { transfer: input.ownershipTransferId } : {}),
        })
      : buildLocalizedAppLink(input.locale, `horses/${input.horseId}/connect`);

  const content = waitingTransferNagTemplate({
    to: input.to,
    horseName: input.horseName,
    actionUrl,
    role: input.role,
    locale: input.locale,
  });

  await sendTemplateEmail({ to: input.to, content });
}
