/**
 * VeterinaryHubContent — public veterinary hub assembly
 * (`/veterinaries/[veterinaryId]`).
 *
 * Reads the veterinary view via `useVeterinaryView` (`GET /api/v1/veterinaries/:id`) and
 * renders the hero, about, and contact sections, each wrapped in
 * `SectionErrorBoundary`.
 */

"use client";

import { useTranslations } from "next-intl";

import { SectionErrorBoundary } from "@/components/errors/section-error-boundary.tsx";
import { VeterinaryPageContentSkeleton } from "@/components/veterinary/veterinary-page-content-skeleton.tsx";
import { VeterinaryHubAbout } from "@/components/veterinary/hub/veterinary-hub-about.tsx";
import { VeterinaryHubContact } from "@/components/veterinary/hub/veterinary-hub-contact.tsx";
import { VeterinaryHubHero } from "@/components/veterinary/hub/veterinary-hub-hero.tsx";
import { Section } from "@/components/shared/section.tsx";
import { useVeterinaryView } from "@/hooks/queries/useVeterinary.ts";
import { Link } from "@/i18n/navigation.ts";

type VeterinaryHubContentProps = {
  veterinaryId: string;
};

export function VeterinaryHubContent({ veterinaryId }: VeterinaryHubContentProps) {
  const t = useTranslations("veterinary.hub");
  const { data: view, isLoading, error } = useVeterinaryView(veterinaryId);

  if (isLoading) {
    return <VeterinaryPageContentSkeleton suppressHydrationWarning />;
  }

  if (error || !view?.veterinary) {
    return (
      <div className="mx-auto flex w-full max-w-lg flex-1 flex-col gap-3">
        <p className="text-muted-foreground">{t("loadFailed")}</p>
        <Link
          href="/veterinaries"
          className="text-sm font-medium text-primary underline underline-offset-4 hover:text-foreground"
        >
          {t("backToVets")}
        </Link>
      </div>
    );
  }

  const veterinary = view.veterinary;

  return (
    <div className="flex w-full flex-1 flex-col gap-4" suppressHydrationWarning>
      <SectionErrorBoundary message={t("loadFailed")}>
        <VeterinaryHubHero veterinary={veterinary} />
      </SectionErrorBoundary>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2 lg:items-stretch">
        <Section title={t("about")}>
          <SectionErrorBoundary message={t("loadFailed")}>
            <VeterinaryHubAbout veterinary={veterinary} />
          </SectionErrorBoundary>
        </Section>

        <Section title={t("contact")}>
          <SectionErrorBoundary message={t("loadFailed")}>
            <VeterinaryHubContact veterinary={veterinary} />
          </SectionErrorBoundary>
        </Section>
      </div>
    </div>
  );
}
