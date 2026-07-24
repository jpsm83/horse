"use client";

import { useTranslations } from "next-intl";

import { HorseAdminRoleInviteSection } from "@/components/horses/admin/horse-admin-role-invite-section.tsx";

type HorseProactiveRepresentativesSectionProps = {
  horseId: string;
};

export function HorseProactiveRepresentativesSection({ horseId }: HorseProactiveRepresentativesSectionProps) {
  const t = useTranslations("horseAdmin");

  return (
    <HorseAdminRoleInviteSection
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
        sendEmailInvite: t("sendEmailInvite"),
        cancelLabel: t("cancel"),
      }}
    />
  );
}
