"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { ErrorBoundary } from "react-error-boundary";
import { Upload } from "lucide-react";

import { HorsePageShell } from "@/components/horses/horse-page-shell.tsx";
import { Section } from "@/components/shared/section.tsx";
import { SectionTitleAction } from "@/components/shared/section-title-action.tsx";
import { InlineErrorFallback } from "@/components/errors/inline-error-fallback.tsx";
import { HorseDocumentsTableSection } from "@/components/horses/documents/horse-documents-table-section.tsx";
import { HorseDocumentsUploadDialog } from "@/components/horses/documents/horse-documents-upload-dialog.tsx";

type DocumentsContentProps = {
  horseId: string;
};

export function DocumentsContent({ horseId }: DocumentsContentProps) {
  const t = useTranslations("horseDocuments");
  const [uploadOpen, setUploadOpen] = useState(false);

  return (
    <HorsePageShell horseId={horseId}>
      <Section
        title={t("documentsTitle")}
        className="flex-1"
        titleAddon={
          <SectionTitleAction onClick={() => setUploadOpen(true)}>
            <Upload className="size-3" />
            {t("uploadButton")}
          </SectionTitleAction>
        }
      >
        <ErrorBoundary fallbackRender={(p) => <InlineErrorFallback {...p} />}>
          <HorseDocumentsTableSection horseId={horseId} />
        </ErrorBoundary>
      </Section>

      <HorseDocumentsUploadDialog
        horseId={horseId}
        open={uploadOpen}
        onOpenChange={setUploadOpen}
      />
    </HorsePageShell>
  );
}
