"use client";

import { useTranslations } from "next-intl";
import { ErrorBoundary } from "react-error-boundary";

import { HorsePageShell } from "@/components/horses/horse-page-shell.tsx";
import { HorseMediaUploadSection } from "@/components/horses/media/horse-media-upload-section.tsx";
import { HorseMediaGallerySection } from "@/components/horses/media/horse-media-gallery-section.tsx";
import { HorseSectionVisibility } from "@/components/horses/shared/horse-section-visibility.tsx";
import { InlineErrorFallback } from "@/components/errors/inline-error-fallback.tsx";
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
    <>
      <Section
        title={t("uploadTitle")}
        description={t("uploadDescription")}
        className="shrink-0"
      >
        <ErrorBoundary fallbackRender={(p) => <InlineErrorFallback {...p} />}>
          <HorseMediaUploadSection
            horseId={horseId}
            sourceEntityType="horse"
          />
        </ErrorBoundary>
      </Section>

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
        <ErrorBoundary fallbackRender={(p) => <InlineErrorFallback {...p} />}>
          <HorseMediaGallerySection horseId={horseId} />
        </ErrorBoundary>
      </Section>
    </>
  );
}
