"use client";

import { useTranslations } from "next-intl";

import { SectionErrorBoundary } from "@/components/errors/section-error-boundary.tsx";
import { HorsePageShell } from "@/components/horses/horse-page-shell.tsx";
import { HorseMediaGallerySection } from "@/components/horses/media/horse-media-gallery-section.tsx";
import { HorseSectionVisibility } from "@/components/horses/shared/horse-section-visibility.tsx";
import { Section } from "@/components/shared/section.tsx";
import type { OwnerHorseSummary } from "@/lib/services/horseService.ts";
import { normalizeHubSections } from "@/lib/horses/hubSections.ts";

type MediaContentProps = {
  horseId: string;
};

export function MediaContent({ horseId }: MediaContentProps) {
  return (
    <HorsePageShell horseId={horseId}>
      {({ horse }) => <MediaSections horseId={horseId} horse={horse} />}
    </HorsePageShell>
  );
}

type MediaSectionsProps = {
  horseId: string;
  horse: OwnerHorseSummary;
};

function MediaSections({ horseId, horse }: MediaSectionsProps) {
  const t = useTranslations("horseMedia");
  const hubSections = normalizeHubSections(horse.hubSections);

  return (
    <Section
      title={t("galleryTitle")}
      className="flex-1"
      visibilityControl={
        horse.isAdmin ? (
          <HorseSectionVisibility
            horseId={horseId}
            sectionKey="gallery"
            mode={hubSections.gallery.mode}
            uiSectionKey="media-gallery"
          />
        ) : undefined
      }
    >
      <SectionErrorBoundary resetKeys={[horseId]}>
        <HorseMediaGallerySection
          horseId={horseId}
          sourceEntityType="horse"
          canManageMedia={horse.isAdmin === true}
        />
      </SectionErrorBoundary>
    </Section>
  );
}
