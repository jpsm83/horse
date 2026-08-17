/**
 * Admin role invite dialog — PendingDialog + email invite for
 * proactive representatives / co-owners (OwnershipTransfer invite).
 */

"use client";

import { useTranslations } from "next-intl";

import { EmailInviteSection } from "@/components/shared/email-invite-section.tsx";
import { PendingDialog } from "@/components/shared/pending-dialog.tsx";
import {
  useCreateOwnershipTransfer,
  type CreateOwnershipTransferInput,
} from "@/hooks/queries/useOwnershipTransfer.ts";
import { useAppToast } from "@/hooks/use-app-toast.ts";

type HorseAdminRoleInviteDialogProps = {
  horseId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  transferKind: Extract<
    CreateOwnershipTransferInput["transferKind"],
    "add_responsible" | "promote_co_owner"
  >;
  title: string;
  description: string;
  successMessage: string;
};

export function HorseAdminRoleInviteDialog({
  horseId,
  open,
  onOpenChange,
  transferKind,
  title,
  description,
  successMessage,
}: HorseAdminRoleInviteDialogProps) {
  const t = useTranslations("horseAdmin");
  const toast = useAppToast();
  const createTransfer = useCreateOwnershipTransfer();
  const isInviting = createTransfer.isPending;

  function handleEmailInvite(email: string) {
    createTransfer.mutate(
      {
        entityType: "horse",
        entityId: horseId,
        transferKind,
        invitedEmail: email,
      },
      {
        onSuccess: () => {
          toast.success(successMessage);
          onOpenChange(false);
        },
        onError: () => toast.error(t("inviteFailed")),
      },
    );
  }

  return (
    <PendingDialog
      open={open}
      onOpenChange={onOpenChange}
      title={title}
      description={description}
      pending={isInviting}
    >
      {open ? (
        <EmailInviteSection
          key={`${horseId}-${transferKind}`}
          isInviting={isInviting}
          onEmailInvite={handleEmailInvite}
          labels={{
            hint: t("emailFallbackHint"),
            emailLabel: t("emailLabel"),
            sendLabel: t("sendEmailInvite"),
          }}
        />
      ) : null}
    </PendingDialog>
  );
}
