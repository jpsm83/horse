"use client";

import { useTranslations } from "next-intl";

import { HorsePageShell } from "@/components/horses/horse-page-shell.tsx";
import type { OwnerHorseSummary } from "@/lib/api/horseClient.ts";

type HorseHubPageContentProps = {
  horseId: string;
};

export function HorseHubPageContent({ horseId }: HorseHubPageContentProps) {
  return (
    <HorsePageShell horseId={horseId}>
      {({ horse }) => <HubBody horseId={horseId} horse={horse} />}
    </HorsePageShell>
  );
}

type HubBodyProps = {
  horseId: string;
  horse: OwnerHorseSummary;
};

function HubBody({ horseId, horse }: HubBodyProps) {
  const t = useTranslations("horseHub");
  const tCommon = useTranslations("common");

  const horseName = horse.name ?? tCommon("horseFallback");
  const subtitle = horse.breed
    ? [horse.breed, horse.sex].filter(Boolean).join(" · ")
    : t("subtitle");

  return (
    <>
      <p className="text-muted-foreground -mt-2">{subtitle || horseName}</p>

      <section className="space-y-2 rounded-lg border border-border bg-card p-4 text-card-foreground">
        <h2 className="text-lg font-semibold">{t("overview")}</h2>
        <dl className="grid grid-cols-2 gap-2 text-sm">
          {horse.dateOfBirth && (
            <>
              <dt className="text-muted-foreground">{t("age")}</dt>
              <dd>
                {new Date().getFullYear() - new Date(horse.dateOfBirth).getFullYear()} years
              </dd>
            </>
          )}
          {horse.color && (
            <>
              <dt className="text-muted-foreground">{t("color")}</dt>
              <dd>{horse.color}</dd>
            </>
          )}
          {horse.heightHands && (
            <>
              <dt className="text-muted-foreground">{t("height")}</dt>
              <dd>{horse.heightHands} hh</dd>
            </>
          )}
          {horse.primaryDiscipline && (
            <>
              <dt className="text-muted-foreground">{t("discipline")}</dt>
              <dd>{horse.primaryDiscipline}</dd>
            </>
          )}
        </dl>
      </section>

      {horse.pedigree && (
        <section className="space-y-2 rounded-lg border border-border bg-card p-4 text-card-foreground">
          <h2 className="text-lg font-semibold">{t("pedigree")}</h2>
          <dl className="grid grid-cols-2 gap-2 text-sm">
            {(horse.pedigree as { sireName?: string }).sireName ? (
              <>
                <dt className="text-muted-foreground">{t("sire")}</dt>
                <dd>{String((horse.pedigree as { sireName?: string }).sireName)}</dd>
              </>
            ) : null}
            {(horse.pedigree as { damName?: string }).damName ? (
              <>
                <dt className="text-muted-foreground">{t("dam")}</dt>
                <dd>{String((horse.pedigree as { damName?: string }).damName)}</dd>
              </>
            ) : null}
          </dl>
        </section>
      )}

      <section className="space-y-2 rounded-lg border border-border bg-card p-4 text-card-foreground">
        <h2 className="text-lg font-semibold">{t("ownership.title")}</h2>
        <p className="text-sm text-muted-foreground">
          {horse.coOwners && horse.coOwners.length > 0
            ? t("ownership.withCoOwners", { count: horse.coOwners.length })
            : t("ownership.soleOwner")}
        </p>
      </section>
    </>
  );
}
