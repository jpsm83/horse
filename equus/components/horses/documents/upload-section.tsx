"use client";

import { useRef, useState } from "react";
import { useTranslations } from "next-intl";
import { Upload, X } from "lucide-react";

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
import { useUploadHorseDocument } from "@/hooks/queries/useHorseDocuments.ts";
import { useAppToast } from "@/hooks/use-app-toast.ts";

type UploadSectionProps = {
  horseId: string;
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

export function UploadSection({ horseId }: UploadSectionProps) {
  const t = useTranslations("horseDocuments");
  const tCommon = useTranslations("common");
  const toast = useAppToast();
  const [showForm, setShowForm] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [documentType, setDocumentType] = useState("");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const uploadMutation = useUploadHorseDocument(horseId);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const selectedFile = fileInputRef.current?.files?.[0];
    if (!selectedFile || !title.trim()) return;

    const formData = new FormData();
    formData.append("file", selectedFile);
    formData.append("documentType", documentType);
    formData.append("title", title.trim());
    if (description.trim()) formData.append("description", description.trim());

    uploadMutation.mutate(formData, {
      onSuccess: () => {
        toast.success(t("uploadSuccess"));
        setShowForm(false);
        setFile(null);
        setTitle("");
        setDescription("");
        setDocumentType("");
        if (fileInputRef.current) fileInputRef.current.value = "";
      },
      onError: () => toast.error(t("uploadError")),
    });
  }

  function handleCancel() {
    setShowForm(false);
    setFile(null);
    setTitle("");
    setDescription("");
    setDocumentType("");
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  return (
    <div className="space-y-4">
      {!showForm ? (
        <Button onClick={() => setShowForm(true)}>
          <Upload className="mr-1 h-4 w-4" />
          {t("uploadButton")}
        </Button>
      ) : (
        <form
          onSubmit={handleSubmit}
          className="space-y-4 rounded-lg border p-4"
          noValidate
        >
          <div className="flex gap-2 sm:gap-4 flex-wrap">
            <div className="space-y-2">
              <Label htmlFor="doc-type">{t("type")}</Label>
              <Select
                value={documentType}
                onValueChange={(value) => setDocumentType(value)}
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
                ref={fileInputRef}
                id="doc-file"
                type="file"
                onChange={(e) => setFile(e.target.files?.[0] ?? null)}
                required
                className="flex h-8 w-full min-w-0 cursor-pointer rounded-lg border border-input bg-transparent file:mr-2 file:rounded-md file:border-0 file:bg-muted file:px-3 file:py-1 file:text-sm file:cursor-pointer"
              />
            </div>

            <div className="space-y-2 flex-1">
              <Label htmlFor="doc-title">{t("title")}</Label>
              <Input
                id="doc-title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="doc-desc">{t("description")}</Label>
            <Textarea
              id="doc-desc"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="flex min-h-[80px] w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm"
            />
          </div>

          <div className="flex gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleCancel}
            >
              <X className="mr-1 h-3 w-3" />
              {tCommon("cancel")}
            </Button>
            <Button
              type="submit"
              size="sm"
              disabled={!file || !title.trim() || uploadMutation.isPending}
            >
              {uploadMutation.isPending ? t("uploading") : t("uploadButton")}
            </Button>
          </div>
        </form>
      )}
    </div>
  );
}
