/**
 * FarrierHubContent — public farrier hub assembly (`/farriers/[farrierId]`).
 *
 * Reads the farrier view via `useFarrierView` (`GET /api/v1/farriers/:id`) and
 * renders the hero, about, and contact sections, each wrapped in
 * `SectionErrorBoundary`.
 */

"use client";

import { useTranslations } from "next-intl";

import { SectionErrorBoundary } from "@/components/errors/section-error-boundary.tsx";
import { FarrierPageContentSkeleton } from "@/components/farrier/farrier-page-content-skeleton.tsx";
import { FarrierHubAbout } from "@/components/farrier/hub/farrier-hub-about.tsx";
import { FarrierHubContact } from "@/components/farrier/hub/farrier-hub-contact.tsx";
import { FarrierHubHero } from "@/components/farrier/hub/farrier-hub-hero.tsx";
import { Section } from "@/components/shared/section.tsx";
import { useFarrierView } from "@/hooks/queries/useFarrier.ts";
import { Link } from "@/i18n/navigation.ts";

type FarrierHubContentProps = {
  farrierId: string;
};

export function FarrierHubContent({ farrierId }: FarrierHubContentProps) {
  const t = useTranslations("farrier.hub");
  const { data: view, isLoading, error } = useFarrierView(farrierId);

  if (isLoading) {
    return <FarrierPageContentSkeleton suppressHydrationWarning />;
  }

  if (error || !view?.farrier) {
    return (
      <div className="mx-auto flex w-full max-w-lg flex-1 flex-col gap-3">
        <p className="text-muted-foreground">{t("loadFailed")}</p>
        <Link
          href="/farriers"
          className="text-sm font-medium text-primary underline underline-offset-4 hover:text-foreground"
        >
          {t("backToFarriers")}
        </Link>
      </div>
    );
  }

  const farrier = view.farrier;

  return (
    <div className="flex w-full flex-1 flex-col gap-4" suppressHydrationWarning>
      <SectionErrorBoundary message={t("loadFailed")}>
        <FarrierHubHero farrier={farrier} />
      </SectionErrorBoundary>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2 lg:items-stretch">
        <Section title={t("about")}>
          <SectionErrorBoundary message={t("loadFailed")}>
            <FarrierHubAbout farrier={farrier} />
          </SectionErrorBoundary>
        </Section>

        <Section title={t("contact")}>
          <SectionErrorBoundary message={t("loadFailed")}>
            <FarrierHubContact farrier={farrier} />
          </SectionErrorBoundary>
        </Section>
      </div>
    </div>
  );
}
