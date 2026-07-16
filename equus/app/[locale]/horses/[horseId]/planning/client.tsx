"use client";

import { useTranslations } from "next-intl";
import { ErrorBoundary } from "react-error-boundary";

import { HorsePageShell } from "@/components/horses/horse-page-shell.tsx";
import { Section } from "@/components/shared/section.tsx";
import { InlineErrorFallback } from "@/components/errors/inline-error-fallback.tsx";
import { PlanningCalendarSection } from "@/components/horses/planning/planning-calendar-section.tsx";

type PlanningContentProps = {
  horseId: string;
};

export function PlanningContent({ horseId }: PlanningContentProps) {
  const t = useTranslations("horsePlanning");

  return (
    <HorsePageShell horseId={horseId}>
      <Section
        title={t("title")}
        description={t("description")}
        className="flex-1"
      >
        <ErrorBoundary fallbackRender={(p) => <InlineErrorFallback {...p} />}>
          <PlanningCalendarSection horseId={horseId} />
        </ErrorBoundary>
      </Section>
    </HorsePageShell>
  );
}
