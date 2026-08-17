"use client";

import { useTranslations } from "next-intl";

import { SectionErrorBoundary } from "@/components/errors/section-error-boundary.tsx";
import { HorseHubAbout } from "@/components/horses/hub/horse-hub-about.tsx";
import { HorseHubValue } from "@/components/horses/hub/horse-hub-value.tsx";
import { HorseHubDisciplines } from "@/components/horses/hub/horse-hub-disciplines.tsx";
import { HorseHubGallery } from "@/components/horses/hub/horse-hub-gallery.tsx";
import { HorseHubHero } from "@/components/horses/hub/horse-hub-hero.tsx";
import { HorseHubPedigree } from "@/components/horses/hub/horse-hub-pedigree.tsx";
import { HorseHubPeople } from "@/components/horses/hub/horse-hub-people.tsx";
import { HorsePageContentSkeleton } from "@/components/horses/horse-page-content-skeleton.tsx";
import { Link } from "@/i18n/navigation.ts";
import { useHorseView } from "@/hooks/queries/useHorse.ts";
import { isFetchError } from "@/lib/api/fetchWithAuth";

type HubContentProps = {
  horseId: string;
  shareUrl: string;
};

export function HubContent({ horseId, shareUrl }: HubContentProps) {
  const t = useTranslations("horseHub");
  const { data: view, isLoading, error } = useHorseView(horseId);

  const horse = view?.horse;

  if (isLoading) {
    return <HorsePageContentSkeleton suppressHydrationWarning />;
  }

  if (error || !horse) {
    const notFound =
      isFetchError(error) &&
      (error.statusCode === 404 || error.statusCode === 403);
    return (
      <div className="mx-auto flex w-full max-w-lg flex-1 flex-col gap-3">
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

  return (
    <div
      className="flex w-full flex-1 flex-col gap-4"
      suppressHydrationWarning
    >
      <SectionErrorBoundary resetKeys={[horseId]} message={t("loadFailed")}>
        <HorseHubHero
          horse={horse}
          shareUrl={shareUrl}
          canEditImages={horse.isAdmin === true}
        />
      </SectionErrorBoundary>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-[1fr_1.5fr_1fr] lg:items-stretch">
        <div className="flex min-w-0 flex-col gap-4">
          <SectionErrorBoundary resetKeys={[horseId]} message={t("loadFailed")}>
            <HorseHubAbout horse={horse} />
          </SectionErrorBoundary>
          <SectionErrorBoundary resetKeys={[horseId]} message={t("loadFailed")}>
            <HorseHubDisciplines horse={horse} />
          </SectionErrorBoundary>
          <SectionErrorBoundary resetKeys={[horseId]} message={t("loadFailed")}>
            <HorseHubValue horse={horse} />
          </SectionErrorBoundary>
        </div>

        {horse.sections.gallery != null ? (
          <div className="flex min-h-0 min-w-0 flex-col lg:h-full">
            <SectionErrorBoundary resetKeys={[horseId]} message={t("loadFailed")}>
              <HorseHubGallery horseId={horseId} className="h-full min-h-0 flex-1" />
            </SectionErrorBoundary>
          </div>
        ) : null}

        <div className="flex min-w-0 flex-col gap-4">
          <SectionErrorBoundary resetKeys={[horseId]} message={t("loadFailed")}>
            <HorseHubPedigree horse={horse} />
          </SectionErrorBoundary>
          <SectionErrorBoundary resetKeys={[horseId]} message={t("loadFailed")}>
            <HorseHubPeople horse={horse} />
          </SectionErrorBoundary>
        </div>
      </div>
    </div>
  );
}
