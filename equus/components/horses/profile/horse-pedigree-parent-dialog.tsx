"use client";

/**
 * Dialog to search/connect a pedigree parent (sire or dam).
 * Uses shared PendingDialog for blur + Spinner while connecting.
 */

import {
  HorseInviteSection,
  type HorseInviteLabels,
} from "@/components/shared/horse-invite-section.tsx";
import { PendingDialog } from "@/components/shared/pending-dialog.tsx";

type HorsePedigreeParentDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description: string;
  isConnecting: boolean;
  labels: HorseInviteLabels;
  onConnect: (parentHorseId: string, parentHorseName: string, ownerId: string) => void;
  onInviteOwner: (email: string, horseName: string) => void;
};

export function HorsePedigreeParentDialog({
  open,
  onOpenChange,
  title,
  description,
  isConnecting,
  labels,
  onConnect,
  onInviteOwner,
}: HorsePedigreeParentDialogProps) {
  return (
    <PendingDialog
      open={open}
      onOpenChange={onOpenChange}
      title={title}
      description={description}
      pending={isConnecting}
    >
      {open ? (
        <HorseInviteSection
          isConnecting={isConnecting}
          onConnect={onConnect}
          onInviteOwner={onInviteOwner}
          labels={labels}
        />
      ) : null}
    </PendingDialog>
  );
}
