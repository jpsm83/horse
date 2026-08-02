/**
 * RidingClubHubContent — public riding club hub assembly
 * (`/riding-clubs/[clubId]`).
 *
 * Reads the pre-seeded club view from the TanStack cache (layout RSC) and
 * renders the hero, about, and contact sections, each wrapped in
 * `SectionErrorBoundary`.
 */

"use client";

import { useTranslations } from "next-intl";

import { SectionErrorBoundary } from "@/components/errors/section-error-boundary.tsx";
import { RidingClubPageContentSkeleton } from "@/components/riding-club/riding-club-page-content-skeleton.tsx";
import { RidingClubHubAbout } from "@/components/riding-club/hub/riding-club-hub-about.tsx";
import { RidingClubHubContact } from "@/components/riding-club/hub/riding-club-hub-contact.tsx";
import { RidingClubHubHero } from "@/components/riding-club/hub/riding-club-hub-hero.tsx";
import { Section } from "@/components/shared/section.tsx";
import { useRidingClubView } from "@/hooks/queries/useRidingClub.ts";
import { Link } from "@/i18n/navigation.ts";

type RidingClubHubContentProps = {
  clubId: string;
};

export function RidingClubHubContent({ clubId }: RidingClubHubContentProps) {
  const t = useTranslations("ridingClub.hub");
  const { data: view, isLoading, error } = useRidingClubView(clubId);

  if (isLoading) {
    return <RidingClubPageContentSkeleton suppressHydrationWarning />;
  }

  if (error || !view?.ridingClub) {
    return (
      <div className="mx-auto flex w-full max-w-lg flex-1 flex-col gap-3">
        <p className="text-muted-foreground">{t("loadFailed")}</p>
        <Link
          href="/riding-clubs"
          className="text-sm font-medium text-primary underline underline-offset-4 hover:text-foreground"
        >
          {t("backToClubs")}
        </Link>
      </div>
    );
  }

  const ridingClub = view.ridingClub;

  return (
    <div className="flex w-full flex-1 flex-col gap-4" suppressHydrationWarning>
      <SectionErrorBoundary message={t("loadFailed")}>
        <RidingClubHubHero ridingClub={ridingClub} />
      </SectionErrorBoundary>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2 lg:items-stretch">
        <Section title={t("about")}>
          <SectionErrorBoundary message={t("loadFailed")}>
            <RidingClubHubAbout ridingClub={ridingClub} />
          </SectionErrorBoundary>
        </Section>

        <Section title={t("contact")}>
          <SectionErrorBoundary message={t("loadFailed")}>
            <RidingClubHubContact ridingClub={ridingClub} />
          </SectionErrorBoundary>
        </Section>
      </div>
    </div>
  );
}
