"use client";

import { useTranslations } from "next-intl";

import { HorseAdminRoleInviteSection } from "@/components/horses/admin/horse-admin-role-invite-section.tsx";

type HorseCoOwnerManagementSectionProps = {
  horseId: string;
};

export function HorseCoOwnerManagementSection({ horseId }: HorseCoOwnerManagementSectionProps) {
  const t = useTranslations("horseAdmin");

  return (
    <HorseAdminRoleInviteSection
      horseId={horseId}
      addTransferKind="promote_co_owner"
      removeTransferKind="remove_co_owner"
      memberSource="coOwners"
      inviteLabels={{
        invited: t("coOwnerInvited"),
        removed: t("coOwnerRemoved"),
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
