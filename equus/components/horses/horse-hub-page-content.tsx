"use client";

import { useTranslations } from "next-intl";

import { HorseProviderInvites } from "@/components/invites/horse-provider-invites.tsx";
import { HorseOwnershipHub } from "@/components/horses/horse-ownership-hub.tsx";
import { HorsePageShell } from "@/components/horses/horse-page-shell.tsx";
import {
  useOwnerHorse,
  useHorsePendingRelationships,
  useHorseOwnershipTransfers,
} from "@/hooks/queries/useHorse.ts";

type HorseHubPageContentProps = {
  horseId: string;
};

export function HorseHubPageContent({ horseId }: HorseHubPageContentProps) {
  const t = useTranslations("horseHub");
  const tCommon = useTranslations("common");
  const { data: horse } = useOwnerHorse(horseId);
  const { data: relationships = [] } = useHorsePendingRelationships(horseId);
  const { data: ownershipTransfers = [] } = useHorseOwnershipTransfers(
    horse?.isMainOwner ? horseId : undefined,
  );

  const isOwner = horse?.isMainOwner === true;
  const horseName = horse?.name ?? tCommon("horseFallback");
  const subtitle = horse?.breed
    ? [horse.breed, horse.sex].filter(Boolean).join(" · ")
    : t("subtitle");

  return (
    <HorsePageShell
      horseId={horseId}
      title={horseName}
      backHref="/horses"
      backLabel={t("backToHorses")}
    >
      <p className="text-muted-foreground -mt-6">{subtitle}</p>

      <HorseOwnershipHub
        horseId={horseId}
        horse={horse!}
        pendingTransfers={ownershipTransfers}
      />

      {isOwner ? (
        <section className="space-y-4">
          <div>
            <h2 className="text-xl font-semibold">{t("connectTitle")}</h2>
            <p className="text-sm text-muted-foreground">{t("connectDescription")}</p>
          </div>
          <HorseProviderInvites
            horseId={horseId}
            pendingRelationships={relationships}
          />
        </section>
      ) : null}
    </HorsePageShell>
  );
}
