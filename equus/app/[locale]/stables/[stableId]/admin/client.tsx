/**
 * StableAdminContent — owner admin tab (`/stables/[stableId]/admin`).
 *
 * Main-owner gated: visibility toggles (discovery) + ownership management.
 * Each data section is wrapped in `SectionErrorBoundary`.
 */

"use client";

import { useTranslations } from "next-intl";

import { SectionErrorBoundary } from "@/components/errors/section-error-boundary.tsx";
import { StableOwnershipSection } from "@/components/stable/admin/stable-ownership-section.tsx";
import { StableVisibilitySection } from "@/components/stable/admin/stable-visibility-section.tsx";
import { StablePageShell } from "@/components/stable/stable-page-shell.tsx";
import { Section } from "@/components/shared/section.tsx";

export function StableAdminContent({ stableId }: { stableId: string }) {
  const t = useTranslations("stable.admin");

  return (
    <StablePageShell stableId={stableId} requireMainOwner>
      {({ stable }) => (
        <div className="flex flex-col gap-6">
          <div className="space-y-2">
            <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">{t("title")}</h1>
            <p className="text-muted-foreground">{t("description")}</p>
          </div>

          <Section title={t("visibilitySection")} description={t("visibilityDescription")}>
            <SectionErrorBoundary message={t("loadFailed")}>
              <StableVisibilitySection stable={stable} />
            </SectionErrorBoundary>
          </Section>

          <Section title={t("ownershipSection")}>
            <SectionErrorBoundary message={t("loadFailed")}>
              <StableOwnershipSection />
            </SectionErrorBoundary>
          </Section>
        </div>
      )}
    </StablePageShell>
  );
}
