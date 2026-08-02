/**
 * RidingClubAdminContent — owner admin tab (`/riding-clubs/[clubId]/admin`).
 *
 * Main-owner gated: visibility toggles (discovery) + ownership management.
 * Each data section is wrapped in `SectionErrorBoundary`.
 */

"use client";

import { useTranslations } from "next-intl";

import { SectionErrorBoundary } from "@/components/errors/section-error-boundary.tsx";
import { RidingClubOwnershipSection } from "@/components/riding-club/admin/riding-club-ownership-section.tsx";
import { RidingClubVisibilitySection } from "@/components/riding-club/admin/riding-club-visibility-section.tsx";
import { RidingClubPageShell } from "@/components/riding-club/riding-club-page-shell.tsx";
import { Section } from "@/components/shared/section.tsx";

export function RidingClubAdminContent({ clubId }: { clubId: string }) {
  const t = useTranslations("ridingClub.admin");

  return (
    <RidingClubPageShell clubId={clubId} requireMainOwner>
      {({ ridingClub }) => (
        <div className="flex flex-col gap-6">
          <div className="space-y-2">
            <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">{t("title")}</h1>
            <p className="text-muted-foreground">{t("description")}</p>
          </div>

          <Section title={t("visibilitySection")} description={t("visibilityDescription")}>
            <SectionErrorBoundary message={t("loadFailed")}>
              <RidingClubVisibilitySection ridingClub={ridingClub} />
            </SectionErrorBoundary>
          </Section>

          <Section title={t("ownershipSection")}>
            <SectionErrorBoundary message={t("loadFailed")}>
              <RidingClubOwnershipSection />
            </SectionErrorBoundary>
          </Section>
        </div>
      )}
    </RidingClubPageShell>
  );
}
