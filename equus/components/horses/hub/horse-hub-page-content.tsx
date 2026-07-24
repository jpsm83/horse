"use client";

import { useTranslations } from "next-intl";

import { EntityTabs } from "@/components/shared/entity-tabs.tsx";
import { HorsePageSkeleton } from "@/components/horses/horse-page-skeleton.tsx";
import { Link } from "@/i18n/navigation.ts";
import type { HorseHubDto } from "@/lib/api/horseClient.ts";
import { getHorseTabs } from "@/lib/navigation/horseTabs.ts";
import { useHorseHub, useOwnerHorse } from "@/hooks/queries/useHorse.ts";
import { useAppAuth } from "@/hooks/use-app-auth.ts";
import { isFetchError } from "@/lib/api/fetchWithAuth";

type HorseHubPageContentProps = {
  horseId: string;
};

export function HorseHubPageContent({ horseId }: HorseHubPageContentProps) {
  const t = useTranslations("horseHub");
  const tCommon = useTranslations("common");
  const { isAuthenticated, isLoading: isAuthLoading } = useAppAuth();
  const {
    data: hub,
    isLoading: isHubLoading,
    error: hubError,
  } = useHorseHub(horseId);
  const { data: ownerHorse } = useOwnerHorse(
    isAuthenticated ? horseId : undefined,
  );

  const isLoading = isAuthLoading || isHubLoading;
  const isAdmin = ownerHorse?.isAdmin === true;
  const isMainOwner = ownerHorse?.isMainOwner === true;

  if (isLoading) {
    return (
      <>
        <EntityTabs
          tabs={getHorseTabs(horseId)}
          isAdmin={isAdmin}
          isMainOwner={isMainOwner}
          isPending
        />
        <div className="mx-auto flex w-full flex-1 flex-col gap-4 p-4 sm:p-6 sm:gap-6">
          <HorsePageSkeleton suppressHydrationWarning />
        </div>
      </>
    );
  }

  if (hubError || !hub) {
    const notFound =
      isFetchError(hubError) && (hubError.statusCode === 404 || hubError.statusCode === 403);
    return (
      <div className="mx-auto flex w-full max-w-lg flex-1 flex-col gap-3 p-6">
        <p className="text-muted-foreground">
          {notFound ? t("notFound") : t("loadFailed")}
        </p>
        <Link
          href="/horses"
          className="text-sm font-medium text-primary underline underline-offset-4 hover:text-foreground"
        >
          {t("backToHorses")}
        </Link>
      </div>
    );
  }

  const horseName = hub.name ?? tCommon("horseFallback");
  const subtitle = hub.breed
    ? [hub.breed, hub.sex].filter(Boolean).join(" · ")
    : t("subtitle");

  return (
    <>
      <EntityTabs
        tabs={getHorseTabs(horseId)}
        isAdmin={isAdmin}
        isMainOwner={isMainOwner}
        isPending={false}
      />
      <div className="mx-auto flex w-full flex-1 flex-col gap-4 p-4 sm:p-6 sm:gap-6">
        <p className="text-muted-foreground -mt-2">{subtitle || horseName}</p>
        <HubSections hub={hub} />
      </div>
    </>
  );
}

function HubSections({ hub }: { hub: HorseHubDto }) {
  const t = useTranslations("horseHub");
  const { sections } = hub;

  return (
    <>
      {sections.identity ? (
        <section className="space-y-2 rounded-lg border border-border bg-card p-4 text-card-foreground">
          <h2 className="text-lg font-semibold">{t("identity")}</h2>
          <dl className="grid grid-cols-2 gap-2 text-sm">
            {sections.identity.age != null && (
              <>
                <dt className="text-muted-foreground">{t("age")}</dt>
                <dd>{sections.identity.age} years</dd>
              </>
            )}
            {sections.identity.color && (
              <>
                <dt className="text-muted-foreground">{t("color")}</dt>
                <dd>{sections.identity.color}</dd>
              </>
            )}
            {sections.identity.heightHands != null && (
              <>
                <dt className="text-muted-foreground">{t("height")}</dt>
                <dd>{sections.identity.heightHands} hh</dd>
              </>
            )}
            {sections.identity.disciplines && sections.identity.disciplines.length > 0 && (
              <>
                <dt className="text-muted-foreground">{t("disciplines")}</dt>
                <dd>{sections.identity.disciplines.join(" · ")}</dd>
              </>
            )}
          </dl>
        </section>
      ) : null}

      {sections.identification ? (
        <section className="space-y-2 rounded-lg border border-border bg-card p-4 text-card-foreground">
          <h2 className="text-lg font-semibold">{t("identification")}</h2>
          <dl className="grid grid-cols-2 gap-2 text-sm">
            {sections.identification.registryId ? (
              <>
                <dt className="text-muted-foreground">{t("registryId")}</dt>
                <dd>{sections.identification.registryId}</dd>
              </>
            ) : null}
            {sections.identification.microchipId ? (
              <>
                <dt className="text-muted-foreground">{t("microchipId")}</dt>
                <dd>{sections.identification.microchipId}</dd>
              </>
            ) : null}
            {sections.identification.passportNumber ? (
              <>
                <dt className="text-muted-foreground">{t("passportNumber")}</dt>
                <dd>{sections.identification.passportNumber}</dd>
              </>
            ) : null}
          </dl>
        </section>
      ) : null}

      {sections.pedigree ? (
        <section className="space-y-2 rounded-lg border border-border bg-card p-4 text-card-foreground">
          <h2 className="text-lg font-semibold">{t("pedigree")}</h2>
          <dl className="grid grid-cols-2 gap-2 text-sm">
            {sections.pedigree.sireName ? (
              <>
                <dt className="text-muted-foreground">{t("sire")}</dt>
                <dd>{sections.pedigree.sireName}</dd>
              </>
            ) : null}
            {sections.pedigree.damName ? (
              <>
                <dt className="text-muted-foreground">{t("dam")}</dt>
                <dd>{sections.pedigree.damName}</dd>
              </>
            ) : null}
          </dl>
        </section>
      ) : null}

      {sections.about ? (
        <section className="space-y-2 rounded-lg border border-border bg-card p-4 text-card-foreground">
          <h2 className="text-lg font-semibold">{t("about")}</h2>
          {sections.about.description ? (
            <p className="text-sm whitespace-pre-wrap">{sections.about.description}</p>
          ) : (
            <p className="text-sm text-muted-foreground">{t("aboutEmpty")}</p>
          )}
        </section>
      ) : null}

      {sections.ownership ? (
        <section className="space-y-2 rounded-lg border border-border bg-card p-4 text-card-foreground">
          <h2 className="text-lg font-semibold">{t("ownership.title")}</h2>
          <p className="text-sm text-muted-foreground">
            {sections.ownership.soleOwner
              ? t("ownership.soleOwner")
              : t("ownership.withCoOwners", { count: sections.ownership.coOwnerCount })}
          </p>
        </section>
      ) : null}
    </>
  );
}
