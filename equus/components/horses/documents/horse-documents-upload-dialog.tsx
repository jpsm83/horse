"use client";

/**
 * HorseDocumentsUploadDialog — upload a horse document via shared PendingDialog.
 */

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Upload } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { PendingDialog } from "@/components/shared/pending-dialog.tsx";
import { useUploadHorseDocument } from "@/hooks/queries/useHorseDocuments.ts";
import { useAppToast } from "@/hooks/use-app-toast.ts";

type HorseDocumentsUploadDialogProps = {
  horseId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

const DOCUMENT_TYPES = [
  "passport",
  "insurance",
  "contract",
  "certificate",
  "medical",
  "invoice",
  "ownership",
  "competition",
  "other",
] as const;

export function HorseDocumentsUploadDialog({
  horseId,
  open,
  onOpenChange,
}: HorseDocumentsUploadDialogProps) {
  const t = useTranslations("horseDocuments");
  const tCommon = useTranslations("common");
  const toast = useAppToast();
  const [file, setFile] = useState<File | null>(null);
  const [fileInputKey, setFileInputKey] = useState(0);
  const [documentType, setDocumentType] = useState("");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");

  const uploadMutation = useUploadHorseDocument(horseId);
  const isPending = uploadMutation.isPending;

  function resetForm() {
    setFile(null);
    setFileInputKey((k) => k + 1);
    setTitle("");
    setDescription("");
    setDocumentType("");
  }

  function handleOpenChange(next: boolean) {
    if (!next) resetForm();
    onOpenChange(next);
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!file || !documentType || !title.trim()) return;

    const formData = new FormData();
    formData.append("file", file);
    formData.append("documentType", documentType);
    formData.append("title", title.trim());
    if (description.trim()) formData.append("description", description.trim());

    uploadMutation.mutate(formData, {
      onSuccess: () => {
        toast.success(t("uploadSuccess"));
        resetForm();
        onOpenChange(false);
      },
      onError: (err) => {
        toast.error(err instanceof Error ? err.message : t("uploadError"));
      },
    });
  }

  return (
    <PendingDialog
      open={open}
      onOpenChange={handleOpenChange}
      title={t("uploadDialogTitle")}
      description={t("uploadDialogDescription")}
      pending={isPending}
    >
      <form onSubmit={handleSubmit} className="space-y-4" noValidate>
        <div className="space-y-2">
          <Label htmlFor="doc-type">{t("type")}</Label>
          <Select
            value={documentType}
            onValueChange={(value) => setDocumentType(value ?? "")}
            disabled={isPending}
          >
            <SelectTrigger id="doc-type" className="h-9 w-full">
              <SelectValue placeholder={t("type")} />
            </SelectTrigger>
            <SelectContent
              side="bottom"
              align="start"
              alignItemWithTrigger={false}
              className="max-h-60"
            >
              {DOCUMENT_TYPES.map((dt) => (
                <SelectItem key={dt} value={dt}>
                  {t(`types.${dt}`)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="doc-file">{t("file")}</Label>
          <input
            key={fileInputKey}
            id="doc-file"
            type="file"
            onChange={(e) => setFile(e.target.files?.[0] ?? null)}
            required
            disabled={isPending}
            className="flex h-8 w-full min-w-0 cursor-pointer rounded-lg border border-input bg-transparent file:mr-2 file:rounded-md file:border-0 file:bg-muted file:px-3 file:py-1 file:text-sm file:cursor-pointer disabled:opacity-50"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="doc-title">{t("title")}</Label>
          <Input
            id="doc-title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
            disabled={isPending}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="doc-desc">{t("description")}</Label>
          <Textarea
            id="doc-desc"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            disabled={isPending}
            className="flex min-h-[80px] w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm"
          />
        </div>

        <div className="flex justify-end gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={() => handleOpenChange(false)}
            disabled={isPending}
          >
            {tCommon("cancel")}
          </Button>
          <Button
            type="submit"
            disabled={!file || !documentType || !title.trim() || isPending}
          >
            {isPending ? (
              t("uploading")
            ) : (
              <>
                <Upload className="size-4" />
                {t("uploadButton")}
              </>
            )}
          </Button>
        </div>
      </form>
    </PendingDialog>
  );
}
