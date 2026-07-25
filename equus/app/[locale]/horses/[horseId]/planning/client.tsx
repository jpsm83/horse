"use client";

import { useTranslations } from "next-intl";
import { ErrorBoundary } from "react-error-boundary";

import { HorsePageShell } from "@/components/horses/horse-page-shell.tsx";
import { HorsePlanningCalendarSection } from "@/components/horses/planning/horse-planning-calendar-section.tsx";
import { HorseSectionVisibility } from "@/components/horses/shared/horse-section-visibility.tsx";
import { InlineErrorFallback } from "@/components/errors/inline-error-fallback.tsx";
import { Section } from "@/components/shared/section.tsx";
import type { OwnerHorseSummary } from "@/lib/services/horseService.ts";
import { normalizeHubSections } from "@/lib/horses/hubSections.ts";

type PlanningContentProps = {
  horseId: string;
};

export function PlanningContent({ horseId }: PlanningContentProps) {
  return (
    <HorsePageShell horseId={horseId}>
      {({ horse }) => <PlanningSections horseId={horseId} horse={horse} />}
    </HorsePageShell>
  );
}

type PlanningSectionsProps = {
  horseId: string;
  horse: OwnerHorseSummary;
};

function PlanningSections({ horseId, horse }: PlanningSectionsProps) {
  const t = useTranslations("horsePlanning");
  const hubSections = normalizeHubSections(horse.hubSections);

  return (
    <Section
      title={t("title")}
      description={t("description")}
      className="flex-1"
      visibilityControl={
        horse.isAdmin ? (
          <HorseSectionVisibility
            horseId={horseId}
            sectionKey="planning"
            mode={hubSections.planning.mode}
            uiSectionKey="planning-calendar"
          />
        ) : undefined
      }
    >
      <ErrorBoundary fallbackRender={(p) => <InlineErrorFallback {...p} />}>
        <HorsePlanningCalendarSection horseId={horseId} isAdmin={horse.isAdmin} />
      </ErrorBoundary>
    </Section>
  );
}
