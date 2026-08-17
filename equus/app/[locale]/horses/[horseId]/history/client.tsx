"use client";

import { useTranslations } from "next-intl";

import { SectionErrorBoundary } from "@/components/errors/section-error-boundary.tsx";
import { HorsePageShell } from "@/components/horses/horse-page-shell.tsx";
import { HorseHistoryAuditSection } from "@/components/horses/history/horse-history-audit-section.tsx";
import { Section } from "@/components/shared/section.tsx";

type HistoryContentProps = {
  horseId: string;
};

export function HistoryContent({ horseId }: HistoryContentProps) {
  const t = useTranslations("horseHistory");

  return (
    <HorsePageShell horseId={horseId} requireOwnership>
      <Section title={t("title")} description={t("description")} className="flex-1">
        <SectionErrorBoundary resetKeys={[horseId]}>
          <HorseHistoryAuditSection horseId={horseId} />
        </SectionErrorBoundary>
      </Section>
    </HorsePageShell>
  );
}
