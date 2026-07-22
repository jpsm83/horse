"use client";

import { FileIcon, ImageIcon, Loader2, Trash2, Upload, VideoIcon, X } from "lucide-react";
import { useTranslations } from "next-intl";
import { useCallback, useEffect, useId, useRef, useState } from "react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export type UploadedFileState = {
  id: string;
  file: File;
  preview?: string;
  url?: string;
  status: "pending" | "uploading" | "uploaded" | "error";
  error?: string;
};

export type FileUploadProps = {
  accept?: string;
  multiple?: boolean;
  maxFiles?: number;
  maxSizeBytes?: number;
  value?: UploadedFileState[];
  onChange?: (files: UploadedFileState[]) => void;
  existingUrls?: string[];
  onRemoveExisting?: (url: string) => void;
  disabled?: boolean;
  uploading?: boolean;
};

const DEFAULT_ACCEPT = "image/*,video/*";
const DEFAULT_MAX_FILES = 10;
const DEFAULT_MAX_SIZE = 10 * 1024 * 1024;

let fileIdCounter = 0;
function nextFileId(): string {
  fileIdCounter += 1;
  return `file-${fileIdCounter}-${Date.now()}`;
}

function getFileIcon(mimeType: string) {
  if (mimeType.startsWith("image/")) return ImageIcon;
  if (mimeType.startsWith("video/")) return VideoIcon;
  return FileIcon;
}

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function FileUpload({
  accept = DEFAULT_ACCEPT,
  multiple = true,
  maxFiles = DEFAULT_MAX_FILES,
  maxSizeBytes = DEFAULT_MAX_SIZE,
  value,
  onChange,
  existingUrls,
  onRemoveExisting,
  disabled = false,
  uploading = false,
}: FileUploadProps) {
  const t = useTranslations("common");
  const inputRef = useRef<HTMLInputElement>(null);
  const inputId = useId();
  const [dragOver, setDragOver] = useState(false);
  const [internalFiles, setInternalFiles] = useState<UploadedFileState[]>([]);

  const files = value ?? internalFiles;
  const setFiles = onChange ?? setInternalFiles;

  const remainingSlots = maxFiles - files.length - (existingUrls?.length ?? 0);

  const addFiles = useCallback(
    (newFiles: FileList | File[]) => {
      const fileArray = Array.from(newFiles);
      const valid: File[] = [];

      for (const file of fileArray) {
        if (files.length + valid.length >= remainingSlots) break;

        const typeMatch = accept
          .split(",")
          .some((pattern) => {
            const trimmed = pattern.trim();
            if (trimmed.endsWith("/*")) {
              const category = trimmed.slice(0, -1);
              return file.type.startsWith(category);
            }
            return file.type.match(new RegExp(trimmed.replace("*", ".*")));
          });

        if (!typeMatch) continue;
        if (file.size > maxSizeBytes) continue;

        valid.push(file);
      }

      if (valid.length === 0) return;

      const newEntries: UploadedFileState[] = valid.map((file) => ({
        id: nextFileId(),
        file,
        preview: file.type.startsWith("image/")
          ? URL.createObjectURL(file)
          : undefined,
        status: "pending" as const,
      }));

      setFiles([...files, ...newEntries]);
    },
    [accept, files, maxSizeBytes, remainingSlots, setFiles],
  );

  function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    if (e.target.files) {
      addFiles(e.target.files);
      e.target.value = "";
    }
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    setDragOver(false);
    if (disabled || uploading) return;
    if (e.dataTransfer.files) {
      addFiles(e.dataTransfer.files);
    }
  }

  const removeFile = useCallback(
    (id: string) => {
      const entry = files.find((f) => f.id === id);
      if (entry?.preview?.startsWith("blob:")) {
        URL.revokeObjectURL(entry.preview);
      }
      setFiles(files.filter((f) => f.id !== id));
    },
    [files, setFiles],
  );

  function setFileStatus(
    id: string,
    status: UploadedFileState["status"],
    extra?: Partial<UploadedFileState>,
  ) {
    setFiles(
      files.map((f) => (f.id === id ? { ...f, status, ...extra } : f)),
    );
  }

  useEffect(() => {
    return () => {
      for (const f of files) {
        if (f.preview?.startsWith("blob:")) {
          URL.revokeObjectURL(f.preview);
        }
      }
    };
  }, []);

  const hasFiles = files.length > 0 || (existingUrls?.length ?? 0) > 0;

  return (
    <div className="space-y-3">
      <div
        data-slot="file-upload-dropzone"
        role="button"
        tabIndex={0}
        aria-label={t("uploadFiles")}
        onDragOver={(e) => {
          e.preventDefault();
          if (!disabled && !uploading) setDragOver(true);
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={handleDrop}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            inputRef.current?.click();
          }
        }}
        onClick={() => inputRef.current?.click()}
        className={cn(
          "flex cursor-pointer flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed p-6 text-center transition-colors",
          dragOver
            ? "border-ring bg-accent/10"
            : "border-muted-foreground/25 hover:border-muted-foreground/50",
          (disabled || uploading || remainingSlots <= 0) &&
            "pointer-events-none opacity-50",
        )}
      >
        <input
          ref={inputRef}
          id={inputId}
          type="file"
          accept={accept}
          multiple={multiple}
          className="sr-only"
          disabled={disabled || uploading}
          onChange={handleFileSelect}
        />
        <Upload className="size-8 text-muted-foreground" aria-hidden />
        <div className="space-y-1">
          <p className="text-sm font-medium">{t("dropFiles")}</p>
          <p className="text-xs text-muted-foreground">
            {t("maxFilesInfo", { count: remainingSlots })}
          </p>
        </div>
      </div>

      {hasFiles ? (
        <div className="grid grid-cols-3 gap-2 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8">
          {existingUrls?.map((url) => (
            <div
              key={url}
              className="group relative isolate aspect-square overflow-hidden rounded-lg border bg-muted"
            >
              {url.match(/\.(mp4|webm|mov|avi|mkv)$/i) ? (
                <video src={url} className="size-full object-cover" />
              ) : (
                <img
                  src={url}
                  alt=""
                  className="size-full object-cover"
                />
              )}
              {onRemoveExisting ? (
                <Button
                  type="button"
                  variant="ghost"
                  size="icon-xs"
                  onClick={() => onRemoveExisting(url)}
                  className="absolute top-1 right-1 size-6 rounded-full bg-black/50 text-white opacity-0 transition-opacity group-hover:opacity-100 hover:bg-black/50 hover:text-white"
                  aria-label={t("remove")}
                >
                  <X className="size-3" />
                </Button>
              ) : null}
            </div>
          ))}

          {files.map((entry) => {
            const FileIconComponent = getFileIcon(entry.file.type);
            return (
              <div
                key={entry.id}
                className={cn(
                  "group relative isolate flex aspect-square flex-col items-center justify-center overflow-hidden rounded-lg border",
                  entry.status === "error" && "border-destructive",
                )}
              >
                {entry.preview ? (
                  <img
                    src={entry.preview}
                    alt=""
                    className="size-full object-cover"
                  />
                ) : (
                  <div className="flex flex-col items-center gap-1 p-2">
                    <FileIconComponent className="size-8 text-muted-foreground" />
                    <span className="max-w-full truncate text-xs">
                      {entry.file.name}
                    </span>
                    <span className="text-[10px] text-muted-foreground">
                      {formatFileSize(entry.file.size)}
                    </span>
                  </div>
                )}

                {entry.status === "uploading" ? (
                  <div className="absolute inset-0 flex items-center justify-center bg-black/30">
                    <Loader2 className="size-6 animate-spin text-white" />
                  </div>
                ) : null}

                {entry.status === "error" ? (
                  <div className="absolute inset-x-0 bottom-0 bg-destructive/80 px-1 py-0.5 text-[10px] text-destructive-foreground">
                    {entry.error ?? t("uploadFailed")}
                  </div>
                ) : null}

                {entry.status === "uploaded" ? (
                  <div className="absolute top-1 right-1 flex size-5 items-center justify-center rounded-full bg-success/80">
                    <svg
                      className="size-3 text-white"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={3}
                        d="M5 13l4 4L19 7"
                      />
                    </svg>
                  </div>
                ) : null}

                <Button
                  type="button"
                  variant="ghost"
                  size="icon-xs"
                  onClick={() => removeFile(entry.id)}
                  disabled={disabled || entry.status === "uploading"}
                  className="absolute top-1 left-1 size-6 rounded-full bg-black/50 text-white opacity-0 transition-opacity group-hover:opacity-100 hover:bg-black/50 hover:text-white disabled:opacity-30"
                  aria-label={t("remove")}
                >
                  <Trash2 className="size-3" />
                </Button>
              </div>
            );
          })}
        </div>
      ) : null}
    </div>
  );
}
