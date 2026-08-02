/**
 * TransportAdminContent — owner admin tab (`/transport/[transportId]/admin`).
 *
 * Main-owner gated: visibility toggles (discovery) + ownership management.
 * Each data section is wrapped in `SectionErrorBoundary`.
 */

"use client";

import { useTranslations } from "next-intl";

import { SectionErrorBoundary } from "@/components/errors/section-error-boundary.tsx";
import { TransportOwnershipSection } from "@/components/transport/admin/transport-ownership-section.tsx";
import { TransportVisibilitySection } from "@/components/transport/admin/transport-visibility-section.tsx";
import { TransportPageShell } from "@/components/transport/transport-page-shell.tsx";
import { Section } from "@/components/shared/section.tsx";

export function TransportAdminContent({ transportId }: { transportId: string }) {
  const t = useTranslations("transport.admin");

  return (
    <TransportPageShell transportId={transportId} requireMainOwner>
      {({ transport }) => (
        <div className="flex flex-col gap-6">
          <div className="space-y-2">
            <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">{t("title")}</h1>
            <p className="text-muted-foreground">{t("description")}</p>
          </div>

          <Section title={t("visibilitySection")} description={t("visibilityDescription")}>
            <SectionErrorBoundary message={t("loadFailed")}>
              <TransportVisibilitySection transport={transport} />
            </SectionErrorBoundary>
          </Section>

          <Section title={t("ownershipSection")}>
            <SectionErrorBoundary message={t("loadFailed")}>
              <TransportOwnershipSection />
            </SectionErrorBoundary>
          </Section>
        </div>
      )}
    </TransportPageShell>
  );
}
