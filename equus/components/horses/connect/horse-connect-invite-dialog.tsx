"use client";

/**
 * HorseConnectInviteDialog — invite providers on the Connect tab.
 *
 * Uses `HorseProviderInvites` + `GET /api/v1/discover/providers` (not people search).
 */

import { useTranslations } from "next-intl";

import { HorseProviderInvites } from "@/components/invites/horse-provider-invites.tsx";
import { PendingDialog } from "@/components/shared/pending-dialog.tsx";
import { useHorsePendingRelationships } from "@/hooks/queries/useHorse.ts";

type HorseConnectInviteDialogProps = {
  horseId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export function HorseConnectInviteDialog({
  horseId,
  open,
  onOpenChange,
}: HorseConnectInviteDialogProps) {
  const t = useTranslations("horseConnect");
  const { data: pendingRelationships = [] } = useHorsePendingRelationships(
    open ? horseId : undefined,
  );

  return (
    <PendingDialog
      open={open}
      onOpenChange={onOpenChange}
      title={t("inviteDialogTitle")}
      description={t("description")}
    >
      {open ? (
        <HorseProviderInvites
          horseId={horseId}
          pendingRelationships={pendingRelationships}
          onInvited={() => onOpenChange(false)}
        />
      ) : null}
    </PendingDialog>
  );
}
