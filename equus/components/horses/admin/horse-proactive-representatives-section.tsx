"use client";

import { useTranslations } from "next-intl";

import { HorseAdminRoleInviteSection } from "@/components/horses/admin/horse-admin-role-invite-section.tsx";

type HorseProactiveRepresentativesSectionProps = {
  horseId: string;
};

export function HorseProactiveRepresentativesSection({
  horseId,
}: HorseProactiveRepresentativesSectionProps) {
  const t = useTranslations("horseAdmin");

  return (
    <HorseAdminRoleInviteSection
      horseId={horseId}
      removeTransferKind="remove_responsible"
      memberSource="responsibles"
      emptyLabel={t("proactiveEmpty")}
      removedMessage={t("proactiveRemoved")}
      removeDescription={(name) =>
        t("adminHistoryRemoveResponsibleDescription", { name })
      }
    />
  );
}
