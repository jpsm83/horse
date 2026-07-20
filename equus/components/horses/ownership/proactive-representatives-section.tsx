"use client";

import { useTranslations } from "next-intl";

import { AdminRoleInviteSection } from "@/components/horses/ownership/admin-role-invite-section.tsx";

type ProactiveRepresentativesSectionProps = {
  horseId: string;
};

export function ProactiveRepresentativesSection({ horseId }: ProactiveRepresentativesSectionProps) {
  const t = useTranslations("horseAdmin");

  return (
    <AdminRoleInviteSection
      horseId={horseId}
      addTransferKind="add_responsible"
      removeTransferKind="remove_responsible"
      memberSource="responsibles"
      inviteLabels={{
        invited: t("proactiveInvited"),
        removed: t("proactiveRemoved"),
      }}
      inviteSectionLabels={{
        searchPlaceholder: t("searchPlaceholder"),
        inviteLabel: t("inviteLabel"),
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
  );
}
