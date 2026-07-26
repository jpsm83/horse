/**
 * Admin role invite dialog — PendingDialog + UserInviteSection for
 * proactive representatives / co-owners (OwnershipTransfer invite).
 */

"use client";

import { useTranslations } from "next-intl";

import { PendingDialog } from "@/components/shared/pending-dialog.tsx";
import {
  UserInviteSection,
  type UserInviteLabels,
} from "@/components/shared/user-invite-section.tsx";
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
  inviteSectionLabels: UserInviteLabels;
};

export function HorseAdminRoleInviteDialog({
  horseId,
  open,
  onOpenChange,
  transferKind,
  title,
  description,
  successMessage,
  inviteSectionLabels,
}: HorseAdminRoleInviteDialogProps) {
  const t = useTranslations("horseAdmin");
  const toast = useAppToast();
  const createTransfer = useCreateOwnershipTransfer();
  const isInviting = createTransfer.isPending;

  function handleInviteUser(userId: string) {
    createTransfer.mutate(
      {
        entityType: "horse",
        entityId: horseId,
        transferKind,
        receiverUserId: userId,
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
        <UserInviteSection
          key={`${horseId}-${transferKind}`}
          isInviting={isInviting}
          onInviteUser={handleInviteUser}
          onEmailInvite={handleEmailInvite}
          labels={inviteSectionLabels}
        />
      ) : null}
    </PendingDialog>
  );
}
