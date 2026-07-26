"use client";

/**
 * HorseConnectInviteDialog — invite providers via shared PendingDialog + UserInviteSection.
 */

import { useTranslations } from "next-intl";

import type { DiscoverProviderType } from "@/lib/api/discoverClient.ts";
import { useCreateRelationshipInvite } from "@/hooks/queries/useRelationship.ts";
import { useAppToast } from "@/hooks/use-app-toast.ts";
import {
  UserInviteSection,
  type UserInviteSearchResult,
} from "@/components/shared/user-invite-section.tsx";
import { PendingDialog } from "@/components/shared/pending-dialog.tsx";

type HorseConnectInviteDialogProps = {
  horseId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

function isEntityInviteResult(
  result: UserInviteSearchResult,
): result is UserInviteSearchResult & { entityType: string } {
  return (
    "entityType" in result &&
    typeof result.entityType === "string" &&
    result.entityType.length > 0
  );
}

export function HorseConnectInviteDialog({
  horseId,
  open,
  onOpenChange,
}: HorseConnectInviteDialogProps) {
  const t = useTranslations("horseConnect");
  const tCommon = useTranslations("common");
  const toast = useAppToast();
  const inviteMutation = useCreateRelationshipInvite();
  const isInviting = inviteMutation.isPending;

  function handleInviteUser(userId: string, result: UserInviteSearchResult) {
    if (!isEntityInviteResult(result)) {
      toast.error(t("invitationCancelled"));
      return;
    }
    inviteMutation.mutate(
      {
        horseId,
        receiverAccountId: userId,
        relationshipType: result.entityType as DiscoverProviderType,
      },
      {
        onSuccess: () => {
          toast.success(t("invitationSent"));
          onOpenChange(false);
        },
        onError: () => toast.error(t("invitationCancelled")),
      },
    );
  }

  function handleEmailInvite(email: string) {
    if (!email.trim()) return;
    inviteMutation.mutate(
      { horseId, invitedEmail: email.trim() },
      {
        onSuccess: () => {
          toast.success(t("invitationSent"));
          onOpenChange(false);
        },
        onError: () => toast.error(t("invitationCancelled")),
      },
    );
  }

  return (
    <PendingDialog
      open={open}
      onOpenChange={onOpenChange}
      title={t("inviteDialogTitle")}
      description={t("description")}
      pending={isInviting}
    >
      {open ? (
        <UserInviteSection
          key={horseId}
          searchMode="entities"
          isInviting={isInviting}
          onInviteUser={handleInviteUser}
          onEmailInvite={handleEmailInvite}
          labels={{
            searchPlaceholder: t("searchPlaceholder"),
            inviteLabel: t("invite"),
            searchingLabel: t("searching"),
            searchErrorLabel: t("searchError"),
            noResultsLabel: t("noResults"),
            emailFallbackToggle: t("emailFallbackToggle"),
            emailFallbackHint: t("emailFallbackHint"),
            emailLabel: t("emailLabel"),
            sendEmailInvite: t("sendEmailInvite"),
            cancelLabel: tCommon("cancel"),
          }}
        />
      ) : null}
    </PendingDialog>
  );
}
