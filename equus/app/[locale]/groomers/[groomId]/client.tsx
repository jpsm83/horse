/**
 * GroomHubContent — public groom hub assembly (`/groomers/[groomId]`).
 *
 * Reads the pre-seeded groom view from the TanStack cache (layout RSC) and
 * renders the hero, about, and contact sections, each wrapped in
 * `SectionErrorBoundary`.
 */

"use client";

import { useTranslations } from "next-intl";

import { SectionErrorBoundary } from "@/components/errors/section-error-boundary.tsx";
import { GroomPageContentSkeleton } from "@/components/groom/groom-page-content-skeleton.tsx";
import { GroomHubAbout } from "@/components/groom/hub/groom-hub-about.tsx";
import { GroomHubContact } from "@/components/groom/hub/groom-hub-contact.tsx";
import { GroomHubHero } from "@/components/groom/hub/groom-hub-hero.tsx";
import { Section } from "@/components/shared/section.tsx";
import { useGroomView } from "@/hooks/queries/useGroom.ts";
import { Link } from "@/i18n/navigation.ts";

type GroomHubContentProps = {
  groomId: string;
};

export function GroomHubContent({ groomId }: GroomHubContentProps) {
  const t = useTranslations("groom.hub");
  const { data: view, isLoading, error } = useGroomView(groomId);

  if (isLoading) {
    return <GroomPageContentSkeleton suppressHydrationWarning />;
  }

  if (error || !view?.groom) {
    return (
      <div className="mx-auto flex w-full max-w-lg flex-1 flex-col gap-3">
        <p className="text-muted-foreground">{t("loadFailed")}</p>
        <Link
          href="/groomers"
          className="text-sm font-medium text-primary underline underline-offset-4 hover:text-foreground"
        >
          {t("backToGrooms")}
        </Link>
      </div>
    );
  }

  const groom = view.groom;

  return (
    <div className="flex w-full flex-1 flex-col gap-4" suppressHydrationWarning>
      <SectionErrorBoundary message={t("loadFailed")}>
        <GroomHubHero groom={groom} />
      </SectionErrorBoundary>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2 lg:items-stretch">
        <Section title={t("about")}>
          <SectionErrorBoundary message={t("loadFailed")}>
            <GroomHubAbout groom={groom} />
          </SectionErrorBoundary>
        </Section>

        <Section title={t("contact")}>
          <SectionErrorBoundary message={t("loadFailed")}>
            <GroomHubContact groom={groom} />
          </SectionErrorBoundary>
        </Section>
      </div>
    </div>
  );
}
