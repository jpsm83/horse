"use client";

import { useTranslations } from "next-intl";

import { HorsePageShell } from "@/components/horses/horse-page-shell.tsx";
import { HorsePlanningCalendarSection } from "@/components/horses/planning/horse-planning-calendar-section.tsx";
import { HorseSectionVisibility } from "@/components/horses/shared/horse-section-visibility.tsx";
import { SectionErrorBoundary } from "@/components/errors/section-error-boundary.tsx";
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
      <SectionErrorBoundary resetKeys={[horseId]}>
        <HorsePlanningCalendarSection
          horseId={horseId}
          horseName={horse.name}
          isAdmin={horse.isAdmin === true}
        />
      </SectionErrorBoundary>
    </Section>
  );
}
