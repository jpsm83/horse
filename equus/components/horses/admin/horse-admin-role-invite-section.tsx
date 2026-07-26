/**
 * Lists co-owners or proactive representatives as chips; remove via OwnershipTransfer.
 * Invite UI lives in HorseAdminRoleInviteDialog (titleAddon Add → PendingDialog).
 */

"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { useQueryClient } from "@tanstack/react-query";

import { EntityChip } from "@/components/shared/entity-chip.tsx";
import { ConfirmDeleteDialog } from "@/components/shared/confirm-delete-dialog.tsx";
import { queryKeys } from "@/lib/api/queryKeys";
import { useHorseView } from "@/hooks/queries/useHorse.ts";
import {
  useCreateOwnershipTransfer,
  type CreateOwnershipTransferInput,
} from "@/hooks/queries/useOwnershipTransfer.ts";
import { useAppToast } from "@/hooks/use-app-toast.ts";

type HorseAdminRoleInviteSectionProps = {
  horseId: string;
  removeTransferKind: Extract<
    CreateOwnershipTransferInput["transferKind"],
    "remove_responsible" | "remove_co_owner"
  >;
  memberSource: "responsibles" | "coOwners";
  emptyLabel: string;
  removedMessage: string;
  removeDescription: (name: string) => string;
};

type RemoveTarget = {
  userId: string;
  name: string;
};

export function HorseAdminRoleInviteSection({
  horseId,
  removeTransferKind,
  memberSource,
  emptyLabel,
  removedMessage,
  removeDescription,
}: HorseAdminRoleInviteSectionProps) {
  const t = useTranslations("horseAdmin");
  const toast = useAppToast();
  const queryClient = useQueryClient();
  const { data: view } = useHorseView(horseId);
  const horse = view?.horse;
  const createTransfer = useCreateOwnershipTransfer();
  const [removeTarget, setRemoveTarget] = useState<RemoveTarget | null>(null);

  if (!horse?.isMainOwner) return null;

  const members =
    memberSource === "coOwners" ? (horse.coOwners ?? []) : (horse.responsibles ?? []);

  function handleConfirmRemove() {
    if (!removeTarget) return;

    createTransfer.mutate(
      {
        entityType: "horse",
        entityId: horseId,
        transferKind: removeTransferKind,
        targetCoOwnerUserId: removeTarget.userId,
      },
      {
        onSuccess: () => {
          toast.success(removedMessage);
          setRemoveTarget(null);
          void queryClient.invalidateQueries({ queryKey: queryKeys.horses.view(horseId) });
          void queryClient.invalidateQueries({
            queryKey: queryKeys.horses.ownershipTransfers(horseId),
          });
        },
        onError: () => toast.error(t("removeFailed")),
      },
    );
  }

  return (
    <>
      {members.length === 0 ? (
        <p className="text-sm text-muted-foreground">{emptyLabel}</p>
      ) : (
        <ul className="flex flex-col gap-2">
          {members.map((member) => (
            <li key={member.userId}>
              <EntityChip
                entityType="user"
                entityId={member.userId}
                title={member.label}
                subtitle={member.email}
                imageUrl={member.imageUrl}
                clearLabel={t("remove")}
                clearDisabled={createTransfer.isPending}
                onClear={() =>
                  setRemoveTarget({ userId: member.userId, name: member.label })
                }
              />
            </li>
          ))}
        </ul>
      )}

      <ConfirmDeleteDialog
        open={removeTarget !== null}
        onOpenChange={(open) => {
          if (!open && !createTransfer.isPending) setRemoveTarget(null);
        }}
        title={t("adminHistoryRemoveConfirmTitle")}
        description={
          removeTarget ? removeDescription(removeTarget.name) : ""
        }
        confirmLabel={t("adminHistoryRemove")}
        cancelLabel={t("cancel")}
        isPending={createTransfer.isPending}
        onConfirm={handleConfirmRemove}
      />
    </>
  );
}
