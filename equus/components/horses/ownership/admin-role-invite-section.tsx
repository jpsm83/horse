"use client";

import { useTranslations } from "next-intl";
import { X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { UserInviteSection, type UserInviteLabels } from "@/components/shared/user-invite-section.tsx";
import { useOwnerHorse } from "@/hooks/queries/useHorse.ts";
import { useCreateOwnershipTransfer } from "@/hooks/queries/useOwnershipTransfer.ts";
import { useAppToast } from "@/hooks/use-app-toast.ts";
import type { CreateOwnershipTransferInput } from "@/hooks/queries/useOwnershipTransfer.ts";

type AdminRoleInviteSectionProps = {
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

export function AdminRoleInviteSection({
  horseId,
  addTransferKind,
  removeTransferKind,
  memberSource,
  inviteLabels,
  inviteSectionLabels,
}: AdminRoleInviteSectionProps) {
  const t = useTranslations("horseAdmin");
  const toast = useAppToast();
  const { data: horse } = useOwnerHorse(horseId);
  const createTransfer = useCreateOwnershipTransfer();

  if (!horse?.isMainOwner) return null;

  const members = horse[memberSource] ?? [];

  function handleInviteUser(userId: string) {
    createTransfer.mutate(
      { entityType: "horse", entityId: horseId, transferKind: addTransferKind, receiverUserId: userId },
      { onSuccess: () => toast.success(inviteLabels.invited), onError: () => toast.error(t("inviteFailed")) },
    );
  }

  function handleEmailInvite(email: string, name?: string) {
    createTransfer.mutate(
      { entityType: "horse", entityId: horseId, transferKind: addTransferKind, invitedEmail: email, invitedName: name },
      { onSuccess: () => toast.success(inviteLabels.invited), onError: () => toast.error(t("inviteFailed")) },
    );
  }

  function handleRemoveMember(userId: string) {
    createTransfer.mutate(
      { entityType: "horse", entityId: horseId, transferKind: removeTransferKind, targetCoOwnerUserId: userId },
      { onSuccess: () => toast.success(inviteLabels.removed), onError: () => toast.error(t("removeFailed")) },
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

      {members.length === 0 ? (
        <p className="text-sm text-muted-foreground">{t("noMembers")}</p>
      ) : (
        <ul className="divide-y divide-border">
          {members.map((m: { userId: string; label?: string; ownershipPercentage?: number }) => (
            <li key={m.userId} className="flex items-center justify-between py-2">
              <div>
                <span className="text-sm font-medium">{m.label ?? m.userId}</span>
                {m.ownershipPercentage != null && (
                  <span className="ml-2 text-xs text-muted-foreground">{m.ownershipPercentage}%</span>
                )}
              </div>
              <Button size="sm" variant="outline" onClick={() => handleRemoveMember(m.userId)}>
                <X className="mr-1 h-3 w-3" />{t("remove")}
              </Button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
