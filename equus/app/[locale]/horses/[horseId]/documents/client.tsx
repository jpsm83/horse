"use client";

import { useTranslations } from "next-intl";
import { ErrorBoundary } from "react-error-boundary";

import { HorsePageShell } from "@/components/horses/horse-page-shell.tsx";
import { Section } from "@/components/shared/section.tsx";
import { InlineErrorFallback } from "@/components/errors/inline-error-fallback.tsx";
import { HorseDocumentsUploadSection } from "@/components/horses/documents/horse-documents-upload-section.tsx";
import { HorseDocumentsTableSection } from "@/components/horses/documents/horse-documents-table-section.tsx";

type DocumentsContentProps = {
  horseId: string;
};

export function DocumentsContent({ horseId }: DocumentsContentProps) {
  const t = useTranslations("horseDocuments");

  return (
    <HorsePageShell horseId={horseId}>
      <Section
        title={t("uploadTitle")}
        description={t("uploadDescription")}
        className="shrink-0"
      >
        <ErrorBoundary fallbackRender={(p) => <InlineErrorFallback {...p} />}>
          <HorseDocumentsUploadSection horseId={horseId} />
        </ErrorBoundary>
      </Section>

      <Section
        title={t("documentsTitle")}
        className="flex-1"
      >
        <ErrorBoundary fallbackRender={(p) => <InlineErrorFallback {...p} />}>
          <HorseDocumentsTableSection horseId={horseId} />
        </ErrorBoundary>
      </Section>
    </HorsePageShell>
  );
}
