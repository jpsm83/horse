/**
 * BreederAdminContent — owner admin tab (`/breeders/[breederId]/admin`).
 *
 * Main-owner gated: visibility toggle (discovery) + ownership management.
 * Each data section is wrapped in `SectionErrorBoundary`.
 */

"use client";

import { useTranslations } from "next-intl";

import { SectionErrorBoundary } from "@/components/errors/section-error-boundary.tsx";
import { BreederOwnershipSection } from "@/components/breeder/admin/breeder-ownership-section.tsx";
import { BreederVisibilitySection } from "@/components/breeder/admin/breeder-visibility-section.tsx";
import { BreederPageShell } from "@/components/breeder/breeder-page-shell.tsx";
import { Section } from "@/components/shared/section.tsx";

export function BreederAdminContent({ breederId }: { breederId: string }) {
  const t = useTranslations("breeder.admin");

  return (
    <BreederPageShell breederId={breederId} requireMainOwner>
      {({ breeder }) => (
        <div className="flex flex-col gap-6">
          <div className="space-y-2">
            <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">{t("title")}</h1>
            <p className="text-muted-foreground">{t("description")}</p>
          </div>

          <Section title={t("visibilitySection")} description={t("visibilityDescription")}>
            <SectionErrorBoundary message={t("loadFailed")}>
              <BreederVisibilitySection breeder={breeder} />
            </SectionErrorBoundary>
          </Section>

          <Section title={t("ownershipSection")}>
            <SectionErrorBoundary message={t("loadFailed")}>
              <BreederOwnershipSection />
            </SectionErrorBoundary>
          </Section>
        </div>
      )}
    </BreederPageShell>
  );
}
