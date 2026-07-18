"use client";

import { useTranslations } from "next-intl";
import { ErrorBoundary } from "react-error-boundary";

import { HorsePageShell } from "@/components/horses/horse-page-shell.tsx";
import { Section } from "@/components/shared/section.tsx";
import { InlineErrorFallback } from "@/components/errors/inline-error-fallback.tsx";
import { MediaUploadSection } from "@/components/horses/media/media-upload-section.tsx";
import { MediaGallerySection } from "@/components/horses/media/media-gallery-section.tsx";

type MediaContentProps = {
  horseId: string;
};

export function MediaContent({ horseId }: MediaContentProps) {
  const t = useTranslations("horseMedia");

  return (
    <HorsePageShell horseId={horseId}>
      <Section
        title={t("uploadTitle")}
        description={t("uploadDescription")}
        className="shrink-0"
      >
        <ErrorBoundary fallbackRender={(p) => <InlineErrorFallback {...p} />}>
          <MediaUploadSection
            horseId={horseId}
            sourceEntityType="horse"
          />
        </ErrorBoundary>
      </Section>

      <Section title={t("galleryTitle")} className="flex-1">
        <ErrorBoundary fallbackRender={(p) => <InlineErrorFallback {...p} />}>
          <MediaGallerySection horseId={horseId} />
        </ErrorBoundary>
      </Section>
    </HorsePageShell>
  );
}
