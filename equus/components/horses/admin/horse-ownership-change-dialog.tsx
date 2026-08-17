/**
 * Change-owner dialog — PendingDialog + email invite, then ConfirmActionDialog
 * before transfer_main.
 */

"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";

import { EmailInviteSection } from "@/components/shared/email-invite-section.tsx";
import { ConfirmActionDialog } from "@/components/shared/confirm-action-dialog.tsx";
import { PendingDialog } from "@/components/shared/pending-dialog.tsx";
import { useCreateOwnershipTransfer } from "@/hooks/queries/useOwnershipTransfer.ts";
import { useAppToast } from "@/hooks/use-app-toast.ts";

type HorseOwnershipChangeDialogProps = {
  horseId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export function HorseOwnershipChangeDialog({
  horseId,
  open,
  onOpenChange,
}: HorseOwnershipChangeDialogProps) {
  const t = useTranslations("horseAdmin");
  const toast = useAppToast();
  const createTransfer = useCreateOwnershipTransfer();
  const [pendingEmail, setPendingEmail] = useState<string | null>(null);

  const isTransferring = createTransfer.isPending;
  const confirmOpen = pendingEmail !== null;

  function handleEmailInvite(email: string) {
    setPendingEmail(email);
    onOpenChange(false);
  }

  function handleConfirmOpenChange(next: boolean) {
    if (isTransferring && !next) return;
    if (!next) setPendingEmail(null);
  }

  function handleConfirmTransfer() {
    if (!pendingEmail) return;

    createTransfer.mutate(
      {
        entityType: "horse",
        entityId: horseId,
        transferKind: "transfer_main",
        invitedEmail: pendingEmail,
      },
      {
        onSuccess: () => {
          toast.success(t("ownershipTransferSent"));
          setPendingEmail(null);
        },
        onError: () => toast.error(t("inviteFailed")),
      },
    );
  }

  return (
    <>
      <PendingDialog
        open={open}
        onOpenChange={onOpenChange}
        title={t("changeOwnerDialogTitle")}
        description={t("changeOwnerDialogDescription")}
      >
        {open ? (
          <EmailInviteSection
            key={horseId}
            isInviting={false}
            onEmailInvite={handleEmailInvite}
            labels={{
              hint: t("emailFallbackHint"),
              emailLabel: t("emailLabel"),
              sendLabel: t("transferOwnership"),
            }}
          />
        ) : null}
      </PendingDialog>

      <ConfirmActionDialog
        open={confirmOpen}
        onOpenChange={handleConfirmOpenChange}
        title={t("ownershipConfirmTitle")}
        description={t("ownershipConfirmDescription")}
        confirmLabel={isTransferring ? t("transferring") : t("confirmTransfer")}
        cancelLabel={t("cancel")}
        isPending={isTransferring}
        variant="destructive"
        onConfirm={handleConfirmTransfer}
      />
    </>
  );
}
