"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { UserInviteSection } from "@/components/shared/user-invite-section.tsx";
import { useOwnerHorse } from "@/hooks/queries/useHorse.ts";
import { useCreateOwnershipTransfer } from "@/hooks/queries/useOwnershipTransfer.ts";
import { useAppToast } from "@/hooks/use-app-toast.ts";

type OwnershipManagementSectionProps = {
  horseId: string;
};

function readInitials(displayName: string): string {
  const parts = displayName.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0]!.slice(0, 2).toUpperCase();
  return `${parts[0]!.charAt(0)}${parts[1]!.charAt(0)}`.toUpperCase();
}

export function OwnershipManagementSection({
  horseId,
}: OwnershipManagementSectionProps) {
  const t = useTranslations("horseAdmin");
  const toast = useAppToast();
  const { data: horse, isPending } = useOwnerHorse(horseId);
  const createTransfer = useCreateOwnershipTransfer();

  const [pendingInvite, setPendingInvite] = useState<{
    userId?: string;
    email?: string;
    name?: string;
  } | null>(null);

  if (isPending && !horse) {
    return (
      <div className="space-y-4">
        <div className="flex items-center gap-3">
          <Skeleton className="size-12 shrink-0 rounded-full" />
          <div className="space-y-2">
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-3 w-48" />
          </div>
        </div>
        <Skeleton className="h-10 w-full" />
      </div>
    );
  }

  if (!horse?.isMainOwner) return null;

  const currentOwner = horse.adminTeam.find(
    (member) => member.type === "owner",
  );

  function handleInviteUser(userId: string) {
    setPendingInvite({ userId });
  }

  function handleEmailInvite(email: string, name?: string) {
    setPendingInvite({ email, name });
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
    } else {
      createTransfer.mutate(
        {
          entityType: "horse",
          entityId: horseId,
          transferKind: "transfer_main",
          invitedEmail: pendingInvite.email,
          invitedName: pendingInvite.name,
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
  }

  return (
    <div className="space-y-6">
      {currentOwner ? (
        <div className="space-y-2">
          <p className="text-sm font-medium text-muted-foreground">
            {t("currentOwner")}
          </p>
          <div className="flex items-center gap-3">
            <Avatar className="size-12 shrink-0 rounded-full ring-2 ring-primary/15">
              {currentOwner.imageUrl ? (
                <AvatarImage
                  src={currentOwner.imageUrl}
                  alt=""
                  className="object-cover"
                />
              ) : null}
              <AvatarFallback className="bg-primary/5 text-sm font-semibold text-primary">
                {readInitials(currentOwner.name)}
              </AvatarFallback>
            </Avatar>
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold">
                {currentOwner.name}
              </p>
              <p className="truncate text-sm text-muted-foreground">
                {currentOwner.email || "—"}
              </p>
            </div>
          </div>
        </div>
      ) : null}

      <hr className="border-border" />

      <UserInviteSection
        isInviting={createTransfer.isPending}
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
          nameLabel: t("nameLabel"),
          sendEmailInvite: t("sendEmailInvite"),
          cancelLabel: t("cancel"),
        }}
      />

      <AlertDialog
        open={pendingInvite !== null}
        onOpenChange={(open) => {
          if (!open) setPendingInvite(null);
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t("ownershipConfirmTitle")}</AlertDialogTitle>
            <AlertDialogDescription>
              {t("ownershipConfirmDescription")}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t("cancel")}</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmTransfer}
              disabled={createTransfer.isPending}
              className="bg-destructive text-white hover:bg-destructive/90"
            >
              {createTransfer.isPending ? (
                <span className="flex items-center gap-1">
                  <span className="size-3 animate-spin rounded-full border-2 border-current border-t-transparent" />
                  {t("transferring")}
                </span>
              ) : (
                t("confirmTransfer")
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
