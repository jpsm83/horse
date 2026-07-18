"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Upload, Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { FileUpload, type UploadedFileState } from "@/components/shared/file-upload.tsx";
import { useUploadHorseMedia } from "@/hooks/queries/useHorseMedia.ts";
import { useAppToast } from "@/hooks/use-app-toast.ts";

type MediaUploadSectionProps = {
  horseId: string;
  sourceEntityType: string;
  sourceEntityId?: string;
};

export function MediaUploadSection({
  horseId,
  sourceEntityType,
  sourceEntityId,
}: MediaUploadSectionProps) {
  const t = useTranslations("horseMedia");
  const toast = useAppToast();
  const [files, setFiles] = useState<UploadedFileState[]>([]);
  const [isUploading, setIsUploading] = useState(false);

  const uploadMutation = useUploadHorseMedia(horseId);

  async function handleUpload() {
    const pendingFiles = files.filter((f) => f.status === "pending");
    if (pendingFiles.length === 0) return;

    setIsUploading(true);

    setFiles((prev) =>
      prev.map((f) =>
        f.status === "pending" ? { ...f, status: "uploading" as const } : f,
      ),
    );

    uploadMutation.mutate(
      {
        files: pendingFiles.map((f) => f.file),
        sourceEntityType,
        sourceEntityId,
      },
      {
        onSuccess: () => {
          toast.success(t("uploadSuccess"));
          setFiles([]);
        },
        onError: () => {
          toast.error(t("uploadError"));
          setFiles((prev) =>
            prev.map((f) =>
              f.status === "uploading"
                ? { ...f, status: "error" as const, error: t("uploadError") }
                : f,
            ),
          );
        },
        onSettled: () => {
          setIsUploading(false);
        },
      },
    );
  }

  const hasPendingFiles = files.some((f) => f.status === "pending");

  return (
    <div className="space-y-4">
      <FileUpload
        value={files}
        onChange={setFiles}
        accept="image/*,video/*"
        maxFiles={10}
        maxSizeBytes={10 * 1024 * 1024}
        disabled={isUploading}
        uploading={isUploading}
      />
      {hasPendingFiles && (
        <Button onClick={handleUpload} disabled={isUploading}>
          {isUploading ? (
            <>
              <Loader2 className="mr-1 h-4 w-4 animate-spin" />
              {t("uploading")}
            </>
          ) : (
            <>
              <Upload className="mr-1 h-4 w-4" />
              {t("uploadButton")}
            </>
          )}
        </Button>
      )}
    </div>
  );
}
