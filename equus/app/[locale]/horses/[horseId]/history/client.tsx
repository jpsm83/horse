"use client";

import { useTranslations } from "next-intl";
import { ErrorBoundary } from "react-error-boundary";

import { HorsePageShell } from "@/components/horses/horse-page-shell.tsx";
import { HorseHistoryAuditSection } from "@/components/horses/history/horse-history-audit-section.tsx";
import { InlineErrorFallback } from "@/components/errors/inline-error-fallback.tsx";
import { Section } from "@/components/shared/section.tsx";

type HistoryContentProps = {
  horseId: string;
};

export function HistoryContent({ horseId }: HistoryContentProps) {
  const t = useTranslations("horseHistory");

  return (
    <HorsePageShell horseId={horseId} requireOwnership>
      <Section title={t("title")} description={t("description")} className="flex-1">
        <ErrorBoundary fallbackRender={(p) => <InlineErrorFallback {...p} />}>
          <HorseHistoryAuditSection horseId={horseId} />
        </ErrorBoundary>
      </Section>
    </HorsePageShell>
  );
}
