/**
 * BreederHubContent — public breeder hub assembly (`/breeders/[breederId]`).
 *
 * Reads the breeder view via `useBreederView` (`GET /api/v1/breeders/:id`) and
 * renders the hero, about, and contact sections, each wrapped in
 * `SectionErrorBoundary`.
 */

"use client";

import { useTranslations } from "next-intl";

import { SectionErrorBoundary } from "@/components/errors/section-error-boundary.tsx";
import { BreederPageContentSkeleton } from "@/components/breeder/breeder-page-content-skeleton.tsx";
import { BreederHubAbout } from "@/components/breeder/hub/breeder-hub-about.tsx";
import { BreederHubContact } from "@/components/breeder/hub/breeder-hub-contact.tsx";
import { BreederHubHero } from "@/components/breeder/hub/breeder-hub-hero.tsx";
import { Section } from "@/components/shared/section.tsx";
import { useBreederView } from "@/hooks/queries/useBreeder.ts";
import { Link } from "@/i18n/navigation.ts";

type BreederHubContentProps = {
  breederId: string;
};

export function BreederHubContent({ breederId }: BreederHubContentProps) {
  const t = useTranslations("breeder.hub");
  const { data: view, isLoading, error } = useBreederView(breederId);

  if (isLoading) {
    return <BreederPageContentSkeleton suppressHydrationWarning />;
  }

  if (error || !view?.breeder) {
    return (
      <div className="mx-auto flex w-full max-w-lg flex-1 flex-col gap-3">
        <p className="text-muted-foreground">{t("loadFailed")}</p>
        <Link
          href="/breeders"
          className="text-sm font-medium text-primary underline underline-offset-4 hover:text-foreground"
        >
          {t("backToBreeders")}
        </Link>
      </div>
    );
  }

  const breeder = view.breeder;

  return (
    <div className="flex w-full flex-1 flex-col gap-4" suppressHydrationWarning>
      <SectionErrorBoundary message={t("loadFailed")}>
        <BreederHubHero breeder={breeder} />
      </SectionErrorBoundary>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2 lg:items-stretch">
        <Section title={t("about")}>
          <SectionErrorBoundary message={t("loadFailed")}>
            <BreederHubAbout breeder={breeder} />
          </SectionErrorBoundary>
        </Section>

        <Section title={t("contact")}>
          <SectionErrorBoundary message={t("loadFailed")}>
            <BreederHubContact breeder={breeder} />
          </SectionErrorBoundary>
        </Section>
      </div>
    </div>
  );
}
