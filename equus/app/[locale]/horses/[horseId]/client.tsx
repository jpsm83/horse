"use client";

import { useTranslations } from "next-intl";
import { ErrorBoundary } from "react-error-boundary";

import { HorseHubHero } from "@/components/horses/hub/horse-hub-hero.tsx";
import { HorseHubStats } from "@/components/horses/hub/horse-hub-stats.tsx";
import { HorseHubAbout } from "@/components/horses/hub/horse-hub-about.tsx";
import { HorseHubGallery } from "@/components/horses/hub/horse-hub-gallery.tsx";
import { HorseHubUpcomingEvents } from "@/components/horses/hub/horse-hub-upcoming-events.tsx";
import { HorseHubPedigree } from "@/components/horses/hub/horse-hub-pedigree.tsx";
import { HorseHubTeam } from "@/components/horses/hub/horse-hub-team.tsx";
import { HorseHubIdentification } from "@/components/horses/hub/horse-hub-identification.tsx";
import { HorsePageSkeleton } from "@/components/horses/horse-page-skeleton.tsx";
import { EntityTabs } from "@/components/shared/entity-tabs.tsx";
import { Section } from "@/components/shared/section.tsx";
import { InlineErrorFallback } from "@/components/errors/inline-error-fallback.tsx";
import { Link } from "@/i18n/navigation.ts";
import { getHorseTabs } from "@/lib/navigation/horseTabs.ts";
import { useHorseView } from "@/hooks/queries/useHorse.ts";
import { isFetchError } from "@/lib/api/fetchWithAuth";
import type { HorseTab } from "@/lib/services/horseService.ts";

type HubContentProps = {
  horseId: string;
};

export function HubContent({ horseId }: HubContentProps) {
  const t = useTranslations("horseHub");
  const { data: view, isLoading, error } = useHorseView(horseId);

  const horse = view?.horse;
  const allowedTabs = view?.allowedTabs as HorseTab[] | undefined;
  const isAdmin = horse?.isAdmin === true;
  const isMainOwner = horse?.isMainOwner === true;
  const tabs = getHorseTabs(horseId, allowedTabs);

  if (isLoading) {
    return (
      <>
        <EntityTabs tabs={tabs} isAdmin={isAdmin} isMainOwner={isMainOwner} isPending />
        <div className="mx-auto flex w-full flex-1 flex-col gap-4 p-4 sm:p-6 sm:gap-6">
          <HorsePageSkeleton suppressHydrationWarning />
        </div>
      </>
    );
  }

  if (error || !horse) {
    const notFound =
      isFetchError(error) && (error.statusCode === 404 || error.statusCode === 403);
    return (
      <>
        <EntityTabs tabs={tabs} isAdmin={isAdmin} isMainOwner={isMainOwner} isPending={false} />
        <div className="mx-auto flex w-full max-w-lg flex-1 flex-col gap-3 p-6">
          <p className="text-muted-foreground">{notFound ? t("notFound") : t("loadFailed")}</p>
          <Link
            href="/horses"
            className="text-sm font-medium text-primary underline underline-offset-4 hover:text-foreground"
          >
            {t("backToHorses")}
          </Link>
        </div>
      </>
    );
  }

  const { sections } = horse;

  return (
    <>
      <EntityTabs tabs={tabs} isAdmin={isAdmin} isMainOwner={isMainOwner} isPending={false} />
      <div className="mx-auto flex w-full flex-1 flex-col gap-6 p-4 sm:p-6">
        {/* Hero — always visible */}
        <HorseHubHero horse={horse} />

        {/* Stats & disciplines — from identity section */}
        {sections.identity && (
          <ErrorBoundary fallbackRender={(p) => <InlineErrorFallback {...p} />}>
            <HorseHubStats identity={sections.identity} />
          </ErrorBoundary>
        )}

        {/* About */}
        {sections.about && (
          <Section title={t("about")}>
            <ErrorBoundary fallbackRender={(p) => <InlineErrorFallback {...p} />}>
              <HorseHubAbout about={sections.about} />
            </ErrorBoundary>
          </Section>
        )}

        {/* Gallery */}
        {sections.gallery && (
          <Section title={t("gallery")}>
            <ErrorBoundary fallbackRender={(p) => <InlineErrorFallback {...p} />}>
              <HorseHubGallery gallery={sections.gallery} />
            </ErrorBoundary>
          </Section>
        )}

        {/* Upcoming events */}
        {sections.planning && (
          <Section title={t("planning")}>
            <ErrorBoundary fallbackRender={(p) => <InlineErrorFallback {...p} />}>
              <HorseHubUpcomingEvents events={sections.planning} />
            </ErrorBoundary>
          </Section>
        )}

        {/* Pedigree */}
        {sections.pedigree && (
          <Section title={t("pedigree")}>
            <ErrorBoundary fallbackRender={(p) => <InlineErrorFallback {...p} />}>
              <HorseHubPedigree pedigree={sections.pedigree} />
            </ErrorBoundary>
          </Section>
        )}

        {/* Team / ownership + connections */}
        {(sections.ownership || sections.connections) && (
          <Section title={t("ownership")}>
            <ErrorBoundary fallbackRender={(p) => <InlineErrorFallback {...p} />}>
              <HorseHubTeam ownership={sections.ownership} connections={sections.connections} />
            </ErrorBoundary>
          </Section>
        )}

        {/* Identification */}
        {sections.identification && (
          <Section title={t("identification")}>
            <ErrorBoundary fallbackRender={(p) => <InlineErrorFallback {...p} />}>
              <HorseHubIdentification identification={sections.identification} />
            </ErrorBoundary>
          </Section>
        )}
      </div>
    </>
  );
}
