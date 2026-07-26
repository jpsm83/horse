"use client";

import { useTranslations } from "next-intl";

import { HorseAdminRoleInviteSection } from "@/components/horses/admin/horse-admin-role-invite-section.tsx";

type HorseCoOwnerManagementSectionProps = {
  horseId: string;
};

export function HorseCoOwnerManagementSection({
  horseId,
}: HorseCoOwnerManagementSectionProps) {
  const t = useTranslations("horseAdmin");

  return (
    <HorseAdminRoleInviteSection
      horseId={horseId}
      removeTransferKind="remove_co_owner"
      memberSource="coOwners"
      emptyLabel={t("coOwnerEmpty")}
      removedMessage={t("coOwnerRemoved")}
      removeDescription={(name) =>
        t("adminHistoryRemoveCoOwnerDescription", { name })
      }
    />
  );
}
