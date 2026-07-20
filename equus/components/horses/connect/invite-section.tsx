"use client";

import { useTranslations } from "next-intl";
import type { DiscoverProviderType } from "@/lib/api/discoverClient.ts";
import { useCreateRelationshipInvite } from "@/hooks/queries/useRelationship.ts";
import { useAppToast } from "@/hooks/use-app-toast.ts";
import { UserInviteSection } from "@/components/shared/user-invite-section.tsx";

type InviteSectionProps = {
  horseId: string;
};

export function InviteSection({ horseId }: InviteSectionProps) {
  const t = useTranslations("horseConnect");
  const tCommon = useTranslations("common");
  const toast = useAppToast();
  const inviteMutation = useCreateRelationshipInvite();

  function handleInviteUser(userId: string, result: { entityType: string }) {
    inviteMutation.mutate(
      { horseId, receiverAccountId: userId, relationshipType: result.entityType as DiscoverProviderType },
      { onSuccess: () => toast.success(t("invitationSent")), onError: () => toast.error(t("invitationCancelled")) },
    );
  }

  function handleEmailInvite(email: string, name?: string) {
    if (!email.trim()) return;
    inviteMutation.mutate(
      { horseId, invitedEmail: email.trim(), invitedName: name },
      { onSuccess: () => toast.success(t("invitationSent")), onError: () => toast.error(t("invitationCancelled")) },
    );
  }

  return (
    <UserInviteSection
      isInviting={inviteMutation.isPending}
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
        nameLabel: t("nameLabel"),
        sendEmailInvite: t("sendEmailInvite"),
        cancelLabel: tCommon("cancel"),
      }}
    />
  );
}
