/**
 * StableHubContent — public stable hub assembly (`/stables/[stableId]`).
 *
 * Reads the stable view via `useStableView` (`GET /api/v1/stables/:id`) and
 * renders the hero, about, and contact sections, each wrapped in
 * `SectionErrorBoundary`.
 */

"use client";

import { useTranslations } from "next-intl";

import { SectionErrorBoundary } from "@/components/errors/section-error-boundary.tsx";
import { StablePageContentSkeleton } from "@/components/stable/stable-page-content-skeleton.tsx";
import { StableHubAbout } from "@/components/stable/hub/stable-hub-about.tsx";
import { StableHubContact } from "@/components/stable/hub/stable-hub-contact.tsx";
import { StableHubHero } from "@/components/stable/hub/stable-hub-hero.tsx";
import { Section } from "@/components/shared/section.tsx";
import { useStableView } from "@/hooks/queries/useStable.ts";
import { Link } from "@/i18n/navigation.ts";

type StableHubContentProps = {
  stableId: string;
};

export function StableHubContent({ stableId }: StableHubContentProps) {
  const t = useTranslations("stable.hub");
  const { data: view, isLoading, error } = useStableView(stableId);

  if (isLoading) {
    return <StablePageContentSkeleton suppressHydrationWarning />;
  }

  if (error || !view?.stable) {
    return (
      <div className="mx-auto flex w-full max-w-lg flex-1 flex-col gap-3">
        <p className="text-muted-foreground">{t("loadFailed")}</p>
        <Link
          href="/stables"
          className="text-sm font-medium text-primary underline underline-offset-4 hover:text-foreground"
        >
          {t("backToStables")}
        </Link>
      </div>
    );
  }

  const stable = view.stable;

  return (
    <div className="flex w-full flex-1 flex-col gap-4" suppressHydrationWarning>
      <SectionErrorBoundary message={t("loadFailed")}>
        <StableHubHero stable={stable} />
      </SectionErrorBoundary>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2 lg:items-stretch">
        <Section title={t("about")}>
          <SectionErrorBoundary message={t("loadFailed")}>
            <StableHubAbout stable={stable} />
          </SectionErrorBoundary>
        </Section>

        <Section title={t("contact")}>
          <SectionErrorBoundary message={t("loadFailed")}>
            <StableHubContact stable={stable} />
          </SectionErrorBoundary>
        </Section>
      </div>
    </div>
  );
}
