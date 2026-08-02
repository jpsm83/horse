/**
 * CoachHubContent — public coach hub assembly (`/coaches/[coachId]`).
 *
 * Reads the pre-seeded coach view from the TanStack cache (layout RSC) and
 * renders the hero, about, and contact sections, each wrapped in
 * `SectionErrorBoundary`.
 */

"use client";

import { useTranslations } from "next-intl";

import { CoachPageContentSkeleton } from "@/components/coach/coach-page-content-skeleton.tsx";
import { CoachHubAbout } from "@/components/coach/hub/coach-hub-about.tsx";
import { CoachHubContact } from "@/components/coach/hub/coach-hub-contact.tsx";
import { CoachHubHero } from "@/components/coach/hub/coach-hub-hero.tsx";
import { SectionErrorBoundary } from "@/components/errors/section-error-boundary.tsx";
import { Section } from "@/components/shared/section.tsx";
import { useCoachView } from "@/hooks/queries/useCoach.ts";
import { Link } from "@/i18n/navigation.ts";

type CoachHubContentProps = {
  coachId: string;
};

export function CoachHubContent({ coachId }: CoachHubContentProps) {
  const t = useTranslations("coach.hub");
  const { data: view, isLoading, error } = useCoachView(coachId);

  if (isLoading) {
    return <CoachPageContentSkeleton suppressHydrationWarning />;
  }

  if (error || !view?.coach) {
    return (
      <div className="mx-auto flex w-full max-w-lg flex-1 flex-col gap-3">
        <p className="text-muted-foreground">{t("loadFailed")}</p>
        <Link
          href="/coaches"
          className="text-sm font-medium text-primary underline underline-offset-4 hover:text-foreground"
        >
          {t("backToCoaches")}
        </Link>
      </div>
    );
  }

  const coach = view.coach;

  return (
    <div className="flex w-full flex-1 flex-col gap-4" suppressHydrationWarning>
      <SectionErrorBoundary message={t("loadFailed")}>
        <CoachHubHero coach={coach} />
      </SectionErrorBoundary>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2 lg:items-stretch">
        <Section title={t("about")}>
          <SectionErrorBoundary message={t("loadFailed")}>
            <CoachHubAbout coach={coach} />
          </SectionErrorBoundary>
        </Section>

        <Section title={t("contact")}>
          <SectionErrorBoundary message={t("loadFailed")}>
            <CoachHubContact coach={coach} />
          </SectionErrorBoundary>
        </Section>
      </div>
    </div>
  );
}
