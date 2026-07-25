"use client";

import { useTranslations } from "next-intl";

import { UserInviteSection, type UserInviteLabels } from "@/components/shared/user-invite-section.tsx";
import { useHorseView } from "@/hooks/queries/useHorse.ts";
import { useCreateOwnershipTransfer } from "@/hooks/queries/useOwnershipTransfer.ts";
import { useAppToast } from "@/hooks/use-app-toast.ts";
import type { CreateOwnershipTransferInput } from "@/hooks/queries/useOwnershipTransfer.ts";

type HorseAdminRoleInviteSectionProps = {
  horseId: string;
  addTransferKind: CreateOwnershipTransferInput["transferKind"];
  removeTransferKind: CreateOwnershipTransferInput["transferKind"];
  memberSource: "responsibles" | "coOwners";
  inviteLabels: {
    invited: string;
    removed: string;
  };
  inviteSectionLabels: UserInviteLabels;
};

export function HorseAdminRoleInviteSection({
  horseId,
  addTransferKind,
  inviteLabels,
  inviteSectionLabels,
}: HorseAdminRoleInviteSectionProps) {
  const t = useTranslations("horseAdmin");
  const toast = useAppToast();
  const { data: view } = useHorseView(horseId);
  const horse = view?.horse;
  const createTransfer = useCreateOwnershipTransfer();

  if (!horse?.isMainOwner) return null;

  function handleInviteUser(userId: string) {
    createTransfer.mutate(
      { entityType: "horse", entityId: horseId, transferKind: addTransferKind, receiverUserId: userId },
      { onSuccess: () => toast.success(inviteLabels.invited), onError: () => toast.error(t("inviteFailed")) },
    );
  }

  function handleEmailInvite(email: string) {
    createTransfer.mutate(
      { entityType: "horse", entityId: horseId, transferKind: addTransferKind, invitedEmail: email },
      { onSuccess: () => toast.success(inviteLabels.invited), onError: () => toast.error(t("inviteFailed")) },
    );
  }

  return (
    <div className="space-y-4">
      <UserInviteSection
        isInviting={createTransfer.isPending}
        onInviteUser={handleInviteUser}
        onEmailInvite={handleEmailInvite}
        labels={inviteSectionLabels}
      />
    </div>
  );
}
