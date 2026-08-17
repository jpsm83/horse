"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Upload } from "lucide-react";

import { SectionErrorBoundary } from "@/components/errors/section-error-boundary.tsx";
import { HorsePageShell } from "@/components/horses/horse-page-shell.tsx";
import { Section } from "@/components/shared/section.tsx";
import { SectionTitleAction } from "@/components/shared/section-title-action.tsx";
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
      {({ horse }) => (
        <>
          <Section
            title={t("documentsTitle")}
            className="flex-1"
            titleAddon={
              horse.isAdmin ? (
                <SectionTitleAction onClick={() => setUploadOpen(true)}>
                  <Upload className="size-3" />
                  {t("uploadButton")}
                </SectionTitleAction>
              ) : undefined
            }
          >
            <SectionErrorBoundary resetKeys={[horseId]}>
              <HorseDocumentsTableSection
                horseId={horseId}
                canManageDocuments={horse.isAdmin === true}
              />
            </SectionErrorBoundary>
          </Section>

          {horse.isAdmin ? (
            <HorseDocumentsUploadDialog
              horseId={horseId}
              open={uploadOpen}
              onOpenChange={setUploadOpen}
            />
          ) : null}
        </>
      )}
    </HorsePageShell>
  );
}
