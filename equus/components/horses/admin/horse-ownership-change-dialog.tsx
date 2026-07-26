/**
 * Change-owner dialog — PendingDialog + UserInviteSection, then ConfirmActionDialog
 * before transfer_main (Connect-invite shell + ownership confirm).
 */

"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";

import { ConfirmActionDialog } from "@/components/shared/confirm-action-dialog.tsx";
import { PendingDialog } from "@/components/shared/pending-dialog.tsx";
import { UserInviteSection } from "@/components/shared/user-invite-section.tsx";
import { useCreateOwnershipTransfer } from "@/hooks/queries/useOwnershipTransfer.ts";
import { useAppToast } from "@/hooks/use-app-toast.ts";

type HorseOwnershipChangeDialogProps = {
  horseId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

type PendingInvite = {
  userId?: string;
  email?: string;
};

export function HorseOwnershipChangeDialog({
  horseId,
  open,
  onOpenChange,
}: HorseOwnershipChangeDialogProps) {
  const t = useTranslations("horseAdmin");
  const toast = useAppToast();
  const createTransfer = useCreateOwnershipTransfer();
  const [pendingInvite, setPendingInvite] = useState<PendingInvite | null>(null);

  const isTransferring = createTransfer.isPending;
  const confirmOpen = pendingInvite !== null;

  function handleInviteUser(userId: string) {
    setPendingInvite({ userId });
    onOpenChange(false);
  }

  function handleEmailInvite(email: string) {
    setPendingInvite({ email });
    onOpenChange(false);
  }

  function handleConfirmOpenChange(next: boolean) {
    if (isTransferring && !next) return;
    if (!next) setPendingInvite(null);
  }

  function handleConfirmTransfer() {
    if (!pendingInvite) return;

    if (pendingInvite.userId) {
      createTransfer.mutate(
        {
          entityType: "horse",
          entityId: horseId,
          transferKind: "transfer_main",
          receiverUserId: pendingInvite.userId,
        },
        {
          onSuccess: () => {
            toast.success(t("ownershipTransferSent"));
            setPendingInvite(null);
          },
          onError: () => toast.error(t("inviteFailed")),
        },
      );
      return;
    }

    createTransfer.mutate(
      {
        entityType: "horse",
        entityId: horseId,
        transferKind: "transfer_main",
        invitedEmail: pendingInvite.email,
      },
      {
        onSuccess: () => {
          toast.success(t("ownershipTransferSent"));
          setPendingInvite(null);
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
          <UserInviteSection
            key={horseId}
            isInviting={false}
            onInviteUser={handleInviteUser}
            onEmailInvite={handleEmailInvite}
            labels={{
              searchPlaceholder: t("searchPlaceholder"),
              inviteLabel: t("transferOwnership"),
              searchingLabel: t("searchingLabel"),
              searchErrorLabel: t("searchErrorLabel"),
              noResultsLabel: t("noResultsLabel"),
              emailFallbackToggle: t("emailFallbackToggle"),
              emailFallbackHint: t("emailFallbackHint"),
              emailLabel: t("emailLabel"),
              sendEmailInvite: t("sendEmailInvite"),
              cancelLabel: t("cancel"),
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
