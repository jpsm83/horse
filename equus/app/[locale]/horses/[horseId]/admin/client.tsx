"use client";

import { useTranslations } from "next-intl";
import { ErrorBoundary } from "react-error-boundary";

import { HorsePageShell } from "@/components/horses/horse-page-shell.tsx";
import { Section } from "@/components/shared/section.tsx";
import { InlineErrorFallback } from "@/components/errors/inline-error-fallback.tsx";
import { SaleSettingsSection } from "@/components/horses/ownership/sale-settings-section.tsx";
import { OwnershipHubSection } from "@/components/horses/ownership/ownership-hub-section.tsx";
import { ResponsiblePersonsSection } from "@/components/horses/ownership/responsible-persons-section.tsx";
import { OwnershipHistorySection } from "@/components/horses/ownership/ownership-history-section.tsx";

type AdminContentProps = {
  horseId: string;
};

export function AdminContent({ horseId }: AdminContentProps) {
  const t = useTranslations("horseAdmin");

  return (
    <HorsePageShell horseId={horseId} requireOwnership requireMainOwner>
      <Section title={t("pageTitle")} className="shrink-0">
        <ErrorBoundary fallbackRender={(p) => <InlineErrorFallback {...p} />}>
          <SaleSettingsSection horseId={horseId} />
        </ErrorBoundary>
      </Section>

      <Section title={t("ownershipTitle")} className="shrink-0">
        <ErrorBoundary fallbackRender={(p) => <InlineErrorFallback {...p} />}>
          <OwnershipHubSection horseId={horseId} />
        </ErrorBoundary>
      </Section>

      <Section title={t("responsiblePersons")} className="shrink-0">
        <ErrorBoundary fallbackRender={(p) => <InlineErrorFallback {...p} />}>
          <ResponsiblePersonsSection horseId={horseId} />
        </ErrorBoundary>
      </Section>

      <Section title={t("ownershipHistory")} className="flex-1">
        <ErrorBoundary fallbackRender={(p) => <InlineErrorFallback {...p} />}>
          <OwnershipHistorySection horseId={horseId} />
        </ErrorBoundary>
      </Section>
    </HorsePageShell>
  );
}
