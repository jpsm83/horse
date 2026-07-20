"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { ErrorBoundary } from "react-error-boundary";

import { HorsePageShell } from "@/components/horses/horse-page-shell.tsx";
import { Section } from "@/components/shared/section.tsx";
import { InlineErrorFallback } from "@/components/errors/inline-error-fallback.tsx";
import { HorseValueSection } from "@/components/horses/ownership/horse-value-section.tsx";
import { AdminHistorySection } from "@/components/horses/ownership/admin-history-section.tsx";
import { ProactiveRepresentativesSection } from "@/components/horses/ownership/proactive-representatives-section.tsx";
import { CoOwnerManagementSection } from "@/components/horses/ownership/co-owner-management-section.tsx";
import { OwnershipManagementSection } from "@/components/horses/ownership/ownership-management-section.tsx";
import type { SectionVisibility } from "@/components/shared/section-visibility-popover.tsx";

type AdminContentProps = {
  horseId: string;
};

export function AdminContent({ horseId }: AdminContentProps) {
  const t = useTranslations("horseAdmin");
  const [valueVisibility, setValueVisibility] = useState<SectionVisibility>({ mode: "owner" });

  return (
    <HorsePageShell horseId={horseId} requireOwnership requireMainOwner>
      <Section
        title={t("horseValueTitle")}
        sectionKey="admin-value"
        visibility={valueVisibility}
        onVisibilityChange={setValueVisibility}
        className="shrink-0"
      >
        <ErrorBoundary fallbackRender={(p) => <InlineErrorFallback {...p} />}>
          <HorseValueSection horseId={horseId} />
        </ErrorBoundary>
      </Section>

      <Section title={t("adminHistoryTitle")} className="flex-1">
        <ErrorBoundary fallbackRender={(p) => <InlineErrorFallback {...p} />}>
          <AdminHistorySection horseId={horseId} />
        </ErrorBoundary>
      </Section>

      <Section title={t("proactiveRepresentativesTitle")} className="shrink-0">
        <ErrorBoundary fallbackRender={(p) => <InlineErrorFallback {...p} />}>
          <ProactiveRepresentativesSection horseId={horseId} />
        </ErrorBoundary>
      </Section>

      <Section title={t("coOwnerManagementTitle")} className="shrink-0">
        <ErrorBoundary fallbackRender={(p) => <InlineErrorFallback {...p} />}>
          <CoOwnerManagementSection horseId={horseId} />
        </ErrorBoundary>
      </Section>

      <Section title={t("ownershipTitle")} className="shrink-0">
        <ErrorBoundary fallbackRender={(p) => <InlineErrorFallback {...p} />}>
          <OwnershipManagementSection horseId={horseId} />
        </ErrorBoundary>
      </Section>
    </HorsePageShell>
  );
}
