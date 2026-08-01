"use client";

/**
 * Ownership Management body — current owner EntityChip only.
 * Change owner opens HorseOwnershipChangeDialog via Section titleAddon.
 */

import { useTranslations } from "next-intl";

import { EntityChip } from "@/components/shared/entity-chip.tsx";
import { Skeleton } from "@/components/ui/skeleton";
import { useHorseView } from "@/hooks/queries/useHorse.ts";

type HorseOwnershipManagementSectionProps = {
  horseId: string;
};

export function HorseOwnershipManagementSection({
  horseId,
}: HorseOwnershipManagementSectionProps) {
  const t = useTranslations("horseAdmin");
  const { data: view, isPending } = useHorseView(horseId);
  const horse = view?.horse;

  if (isPending && !horse) {
    return (
      <div className="flex items-center gap-3">
        <Skeleton className="size-10 shrink-0 rounded-full" />
        <div className="space-y-2">
          <Skeleton className="h-4 w-32" />
          <Skeleton className="h-3 w-48" />
        </div>
      </div>
    );
  }

  if (!horse?.isMainOwner) return null;

  const currentOwner = horse.adminTeam?.find((member) => member.type === "owner");

  if (!currentOwner) {
    return <p className="text-sm text-muted-foreground">{t("currentOwnerMissing")}</p>;
  }

  return (
    <div className="space-y-2">
      <p className="text-sm font-medium text-muted-foreground">{t("currentOwner")}</p>
      <EntityChip
        entityType="user"
        entityId={currentOwner.userId}
        title={currentOwner.name}
        subtitle={currentOwner.email || undefined}
        imageUrl={currentOwner.imageUrl}
        countryCode={currentOwner.countryCode}
      />
      {currentOwner.joinedAt ? (
        <p className="text-xs text-muted-foreground text-end">
          {t("sinceDate", { date: new Date(currentOwner.joinedAt).toLocaleDateString() })}
        </p>
      ) : null}
    </div>
  );
}
