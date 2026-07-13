"use client";

import { useTranslations } from "next-intl";

import { HorsePageShell } from "@/components/horses/horse-page-shell.tsx";
import { useOwnerHorse } from "@/hooks/queries/useHorse.ts";

type HorseHubPageContentProps = {
  horseId: string;
};

export function HorseHubPageContent({ horseId }: HorseHubPageContentProps) {
  const t = useTranslations("horseHub");
  const tCommon = useTranslations("common");
  const { data: horse } = useOwnerHorse(horseId);

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

      <section className="space-y-2 rounded-lg border p-4">
        <h2 className="text-lg font-semibold">{t("overview")}</h2>
        <dl className="grid grid-cols-2 gap-2 text-sm">
          {horse?.dateOfBirth && (
            <>
              <dt className="text-muted-foreground">{t("age")}</dt>
              <dd>{new Date().getFullYear() - new Date(horse.dateOfBirth).getFullYear()} years</dd>
            </>
          )}
          {horse?.color && (
            <>
              <dt className="text-muted-foreground">{t("color")}</dt>
              <dd>{horse.color}</dd>
            </>
          )}
          {horse?.heightHands && (
            <>
              <dt className="text-muted-foreground">{t("height")}</dt>
              <dd>{horse.heightHands} hh</dd>
            </>
          )}
          {horse?.primaryDiscipline && (
            <>
              <dt className="text-muted-foreground">{t("discipline")}</dt>
              <dd>{horse.primaryDiscipline}</dd>
            </>
          )}
        </dl>
      </section>

      {horse?.pedigree && (
        <section className="space-y-2 rounded-lg border p-4">
          <h2 className="text-lg font-semibold">{t("pedigree")}</h2>
          <dl className="grid grid-cols-2 gap-2 text-sm">
            {horse.pedigree.sire ? (
              <>
                <dt className="text-muted-foreground">{t("sire")}</dt>
                <dd>{String(horse.pedigree.sire)}</dd>
              </>
            ) : null}
            {horse.pedigree.dam ? (
              <>
                <dt className="text-muted-foreground">{t("dam")}</dt>
                <dd>{String(horse.pedigree.dam)}</dd>
              </>
            ) : null}
          </dl>
        </section>
      )}

      <section className="space-y-2 rounded-lg border p-4">
        <h2 className="text-lg font-semibold">{t("ownership.title")}</h2>
        <p className="text-sm text-muted-foreground">
          {horse?.coOwners && horse.coOwners.length > 0
            ? t("ownership.withCoOwners", { count: horse.coOwners.length })
            : t("ownership.soleOwner")}
        </p>
      </section>
    </HorsePageShell>
  );
}
