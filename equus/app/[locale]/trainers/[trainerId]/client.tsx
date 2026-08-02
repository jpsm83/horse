/**
 * TrainerHubContent — public trainer hub assembly (`/trainers/[trainerId]`).
 *
 * Reads the pre-seeded trainer view from the TanStack cache (layout RSC) and
 * renders the hero, about, and contact sections, each wrapped in
 * `SectionErrorBoundary`.
 */

"use client";

import { useTranslations } from "next-intl";

import { SectionErrorBoundary } from "@/components/errors/section-error-boundary.tsx";
import { TrainerPageContentSkeleton } from "@/components/trainer/trainer-page-content-skeleton.tsx";
import { TrainerHubAbout } from "@/components/trainer/hub/trainer-hub-about.tsx";
import { TrainerHubContact } from "@/components/trainer/hub/trainer-hub-contact.tsx";
import { TrainerHubHero } from "@/components/trainer/hub/trainer-hub-hero.tsx";
import { Section } from "@/components/shared/section.tsx";
import { useTrainerView } from "@/hooks/queries/useTrainer.ts";
import { Link } from "@/i18n/navigation.ts";

type TrainerHubContentProps = {
  trainerId: string;
};

export function TrainerHubContent({ trainerId }: TrainerHubContentProps) {
  const t = useTranslations("trainer.hub");
  const { data: view, isLoading, error } = useTrainerView(trainerId);

  if (isLoading) {
    return <TrainerPageContentSkeleton suppressHydrationWarning />;
  }

  if (error || !view?.trainer) {
    return (
      <div className="mx-auto flex w-full max-w-lg flex-1 flex-col gap-3">
        <p className="text-muted-foreground">{t("loadFailed")}</p>
        <Link
          href="/trainers"
          className="text-sm font-medium text-primary underline underline-offset-4 hover:text-foreground"
        >
          {t("backToTrainers")}
        </Link>
      </div>
    );
  }

  const trainer = view.trainer;

  return (
    <div className="flex w-full flex-1 flex-col gap-4" suppressHydrationWarning>
      <SectionErrorBoundary message={t("loadFailed")}>
        <TrainerHubHero trainer={trainer} />
      </SectionErrorBoundary>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2 lg:items-stretch">
        <Section title={t("about")}>
          <SectionErrorBoundary message={t("loadFailed")}>
            <TrainerHubAbout trainer={trainer} />
          </SectionErrorBoundary>
        </Section>

        <Section title={t("contact")}>
          <SectionErrorBoundary message={t("loadFailed")}>
            <TrainerHubContact trainer={trainer} />
          </SectionErrorBoundary>
        </Section>
      </div>
    </div>
  );
}
