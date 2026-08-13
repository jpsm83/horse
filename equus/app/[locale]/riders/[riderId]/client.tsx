/**
 * RiderHubContent — public rider hub assembly (`/riders/[riderId]`).
 *
 * Reads the rider view via `useRiderView` (`GET /api/v1/riders/:id`) and
 * renders the hero, about, and contact sections, each wrapped in
 * `SectionErrorBoundary`.
 */

"use client";

import { useTranslations } from "next-intl";

import { RiderPageContentSkeleton } from "@/components/rider/rider-page-content-skeleton.tsx";
import { RiderHubAbout } from "@/components/rider/hub/rider-hub-about.tsx";
import { RiderHubContact } from "@/components/rider/hub/rider-hub-contact.tsx";
import { RiderHubHero } from "@/components/rider/hub/rider-hub-hero.tsx";
import { SectionErrorBoundary } from "@/components/errors/section-error-boundary.tsx";
import { Section } from "@/components/shared/section.tsx";
import { useRiderView } from "@/hooks/queries/useRider.ts";
import { Link } from "@/i18n/navigation.ts";

type RiderHubContentProps = {
  riderId: string;
};

export function RiderHubContent({ riderId }: RiderHubContentProps) {
  const t = useTranslations("rider.hub");
  const { data: view, isLoading, error } = useRiderView(riderId);

  if (isLoading) {
    return <RiderPageContentSkeleton suppressHydrationWarning />;
  }

  if (error || !view?.rider) {
    return (
      <div className="mx-auto flex w-full max-w-lg flex-1 flex-col gap-3">
        <p className="text-muted-foreground">{t("loadFailed")}</p>
        <Link
          href="/riders"
          className="text-sm font-medium text-primary underline underline-offset-4 hover:text-foreground"
        >
          {t("backToRiders")}
        </Link>
      </div>
    );
  }

  const rider = view.rider;

  return (
    <div className="flex w-full flex-1 flex-col gap-4" suppressHydrationWarning>
      <SectionErrorBoundary message={t("loadFailed")}>
        <RiderHubHero rider={rider} />
      </SectionErrorBoundary>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2 lg:items-stretch">
        <Section title={t("about")}>
          <SectionErrorBoundary message={t("loadFailed")}>
            <RiderHubAbout rider={rider} />
          </SectionErrorBoundary>
        </Section>

        <Section title={t("contact")}>
          <SectionErrorBoundary message={t("loadFailed")}>
            <RiderHubContact rider={rider} />
          </SectionErrorBoundary>
        </Section>
      </div>
    </div>
  );
}
