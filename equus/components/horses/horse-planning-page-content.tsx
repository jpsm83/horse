/**
 * HorsePlanningPageContent — unified planning tab.
 *
 * Renders the planning calendar inside HorsePageShell.
 * The calendar section owns its data, loading state, and errors.
 */

"use client";

import { useTranslations } from "next-intl";
import { ErrorBoundary } from "react-error-boundary";

import { HorsePageShell } from "@/components/horses/horse-page-shell.tsx";
import { PlanningCalendarSection } from "@/components/horses/planning-calendar-section.tsx";
import { InlineErrorFallback } from "@/components/errors/inline-error-fallback.tsx";

type Props = { horseId: string };

export function HorsePlanningPageContent({ horseId }: Props) {
  const t = useTranslations("horsePlanning");

  return (
    <HorsePageShell horseId={horseId} title={t("title")}>
      <ErrorBoundary
        fallbackRender={({ error, resetErrorBoundary }) => (
          <InlineErrorFallback error={error} resetErrorBoundary={resetErrorBoundary} />
        )}
      >
        <PlanningCalendarSection horseId={horseId} />
      </ErrorBoundary>
    </HorsePageShell>
  );
}
