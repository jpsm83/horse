"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import {
  Trash2,
  Play,
  ImageIcon,
  ImagePlus,
  Eye,
  EyeOff,
  Upload,
  Loader2,
} from "lucide-react";

import { Skeleton } from "@/components/ui/skeleton";
import { Spinner } from "@/components/ui/spinner.tsx";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ConfirmDeleteDialog } from "@/components/shared/confirm-delete-dialog.tsx";
import { PendingDialog } from "@/components/shared/pending-dialog.tsx";
import {
  FileUpload,
  type UploadedFileState,
  fileUploadIconForMime,
  formatUploadFileSize,
} from "@/components/shared/file-upload.tsx";
import { HorseMediaLightboxDialog } from "@/components/horses/media/horse-media-lightbox-dialog.tsx";
import { HorseMediaSetAsDialog } from "@/components/horses/media/horse-media-set-as-dialog.tsx";
import {
  useMedia,
  useDeleteMedia,
  useToggleMediaVisibility,
  useUploadMedia,
  useCreateMediaDeletionRequest,
} from "@/hooks/queries/useMedia.ts";
import { useUpdateHorse } from "@/hooks/queries/useHorse.ts";
import { useAppToast } from "@/hooks/use-app-toast.ts";
import type { PublicMedia } from "@/lib/services/mediaService";

type HorseMediaGallerySectionProps = {
  horseId: string;
  sourceEntityType: string;
  sourceEntityId?: string;
  /** Owner team (main owner, co-owner, responsible) — upload, delete, visibility. */
  canManageMedia?: boolean;
};

type HorseMediaGalleryTileImageProps = {
  src: string;
  alt: string;
};

/** Owns load state; remount via key={src} when the URL changes. */
function HorseMediaGalleryTileImage({
  src,
  alt,
}: HorseMediaGalleryTileImageProps) {
  const [loaded, setLoaded] = useState(false);

  return (
    <>
      {!loaded && (
        <div className="relative w-full h-full">
          <div className="absolute inset-0 z-10 flex items-center justify-center">
            <Spinner className="size-6" />
          </div>
          <Skeleton className="absolute inset-0 size-full rounded-none" />
        </div>
      )}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={src}
        alt={alt}
        className={`size-full object-cover transition-transform group-hover:scale-105 ${
          loaded ? "opacity-100" : "opacity-0"
        }`}
        loading="lazy"
        onLoad={() => setLoaded(true)}
        onError={() => setLoaded(true)}
      />
    </>
  );
}

type HorseMediaGalleryTileProps = {
  item: PublicMedia;
  onOpen: () => void;
  canManageMedia: boolean;
  onToggleVisibility?: () => void;
  onRequestDelete?: () => void;
  onRequestDeletion?: () => void;
  onRequestSetAs?: () => void;
  setAsPending?: boolean;
};

function HorseMediaGalleryTile({
  item,
  onOpen,
  canManageMedia,
  onToggleVisibility,
  onRequestDelete,
  onRequestDeletion,
  onRequestSetAs,
  setAsPending = false,
}: HorseMediaGalleryTileProps) {
  const t = useTranslations("horseMedia");
  const imageSrc =
    item.type === "image" || item.thumbnailUrl
      ? (item.thumbnailUrl ?? item.url)
      : null;
  const canSetAsImage = canManageMedia && item.type === "image" && Boolean(onRequestSetAs);
  const showActions =
    canManageMedia || Boolean(onRequestDeletion);

  return (
    <div
      className="group relative aspect-square overflow-hidden rounded-lg border cursor-pointer"
      onClick={onOpen}
    >
      {item.type === "video" && (
        <div className="absolute inset-0 z-10 flex items-center justify-center pointer-events-none">
          <div className="flex items-center justify-center size-12 rounded-full bg-overlay/50">
            <Play className="size-6 text-overlay-foreground ml-0.5" />
          </div>
        </div>
      )}

      {imageSrc ? (
        <HorseMediaGalleryTileImage
          key={imageSrc}
          src={imageSrc}
          alt={item.title ?? ""}
        />
      ) : (
        <div className="flex size-full items-center justify-center bg-muted">
          <ImageIcon className="size-8 text-muted-foreground" />
        </div>
      )}

      {showActions ? (
        <div className="absolute top-1 right-1 z-20 flex gap-1 opacity-0 transition-opacity group-hover:opacity-100">
          {canSetAsImage ? (
            <Button
              variant="ghost"
              size="icon"
              className="size-7 rounded-full bg-overlay/70 text-overlay-foreground hover:bg-overlay/90 hover:text-overlay-foreground border-overlay-foreground"
              disabled={setAsPending}
              aria-label={t("setAsImage")}
              onClick={(e) => {
                e.stopPropagation();
                onRequestSetAs?.();
              }}
            >
              <ImagePlus className="size-3.5" />
            </Button>
          ) : null}
          {canManageMedia ? (
            <>
              <Button
                variant="ghost"
                size="icon"
                className="size-7 rounded-full bg-overlay/70 text-overlay-foreground hover:bg-overlay/90 hover:text-overlay-foreground border-overlay-foreground"
                onClick={(e) => {
                  e.stopPropagation();
                  onToggleVisibility?.();
                }}
              >
                {item.isVisibleOnHub !== false ? (
                  <Eye className="size-3.5" />
                ) : (
                  <EyeOff className="size-3.5" />
                )}
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="size-7 rounded-full bg-destructive/70 text-destructive-foreground hover:bg-destructive/90 hover:text-destructive-foreground border-overlay-foreground"
                onClick={(e) => {
                  e.stopPropagation();
                  onRequestDelete?.();
                }}
              >
                <Trash2 className="size-3.5" />
              </Button>
            </>
          ) : (
            <Button
              variant="ghost"
              size="icon"
              className="size-7 rounded-full bg-destructive/70 text-destructive-foreground hover:bg-destructive/90 hover:text-destructive-foreground border-overlay-foreground"
              aria-label={t("requestDelete")}
              onClick={(e) => {
                e.stopPropagation();
                onRequestDeletion?.();
              }}
            >
              <Trash2 className="size-3.5" />
            </Button>
          )}
        </div>
      ) : null}
    </div>
  );
}

type PendingUploadDialogProps = {
  files: UploadedFileState[];
  descriptions: Record<string, string>;
  isUploading: boolean;
  onDescriptionsChange: (next: Record<string, string>) => void;
  onFilesChange: (next: UploadedFileState[]) => void;
  onUpload: () => void;
  uploadLabel: string;
  uploadingLabel: string;
  descriptionPlaceholder: string;
  removeLabel: string;
};

function PendingUploadDialogContent({
  files,
  descriptions,
  isUploading,
  onDescriptionsChange,
  onFilesChange,
  onUpload,
  uploadLabel,
  uploadingLabel,
  descriptionPlaceholder,
  removeLabel,
}: PendingUploadDialogProps) {
  const pendingFiles = files.filter(
    (f) =>
      f.status === "pending" ||
      f.status === "uploading" ||
      f.status === "error",
  );

  function removeFile(id: string) {
    const entry = files.find((f) => f.id === id);
    if (entry?.preview?.startsWith("blob:")) {
      URL.revokeObjectURL(entry.preview);
    }
    onFilesChange(files.filter((f) => f.id !== id));
    const nextDescriptions = { ...descriptions };
    delete nextDescriptions[id];
    onDescriptionsChange(nextDescriptions);
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
        {pendingFiles.map((entry) => {
          const FileIconComponent = fileUploadIconForMime(entry.file.type);
          return (
            <div key={entry.id} className="space-y-1">
              <div
                className={`group relative isolate flex aspect-square flex-col items-center justify-center overflow-hidden rounded-lg border ${
                  entry.status === "error" ? "border-destructive" : ""
                }`}
              >
                {entry.preview ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={entry.preview}
                    alt=""
                    className="size-full object-cover"
                  />
                ) : (
                  <div className="flex flex-col items-center gap-1 p-2">
                    <FileIconComponent className="size-6 text-muted-foreground" />
                    <span className="max-w-full truncate text-[10px]">
                      {entry.file.name}
                    </span>
                    <span className="text-[10px] text-muted-foreground">
                      {formatUploadFileSize(entry.file.size)}
                    </span>
                  </div>
                )}
                {entry.status === "uploading" ? (
                  <div className="absolute inset-0 flex items-center justify-center bg-overlay/30">
                    <Loader2 className="size-5 animate-spin text-overlay-foreground" />
                  </div>
                ) : null}
                <Button
                  type="button"
                  variant="ghost"
                  size="icon-xs"
                  onClick={() => removeFile(entry.id)}
                  disabled={isUploading || entry.status === "uploading"}
                  className="absolute top-1 left-1 size-6 rounded-full bg-overlay/50 text-overlay-foreground opacity-0 transition-opacity group-hover:opacity-100 hover:bg-overlay/50 hover:text-overlay-foreground disabled:opacity-30"
                  aria-label={removeLabel}
                >
                  <Trash2 className="size-3" />
                </Button>
              </div>
              <Input
                placeholder={descriptionPlaceholder}
                value={descriptions[entry.id] ?? ""}
                onChange={(e) =>
                  onDescriptionsChange({
                    ...descriptions,
                    [entry.id]: e.target.value,
                  })
                }
                className="h-8 text-sm"
                disabled={isUploading}
              />
            </div>
          );
        })}
      </div>
      <div className="flex justify-end">
        <Button
          onClick={onUpload}
          disabled={isUploading || pendingFiles.length === 0}
        >
          {isUploading ? (
            <>
              <Loader2 className="mr-1 h-4 w-4 animate-spin" />
              {uploadingLabel}
            </>
          ) : (
            <>
              <Upload className="mr-1 h-4 w-4" />
              {uploadLabel}
            </>
          )}
        </Button>
      </div>
    </div>
  );
}

export function HorseMediaGallerySection({
  horseId,
  sourceEntityType,
  sourceEntityId,
  canManageMedia = false,
}: HorseMediaGallerySectionProps) {
  const t = useTranslations("horseMedia");
  const tCommon = useTranslations("common");
  const toast = useAppToast();
  const { data: media = [], isPending, isError } = useMedia(horseId);
  const deleteMutation = useDeleteMedia(horseId);
  const deletionRequestMutation = useCreateMediaDeletionRequest(horseId);
  const toggleVisibilityMutation = useToggleMediaVisibility(horseId);
  const uploadMutation = useUploadMedia(horseId);
  const updateHorse = useUpdateHorse();

  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);
  const [deletionRequestTarget, setDeletionRequestTarget] = useState<string | null>(null);
  const [setAsTarget, setSetAsTarget] = useState<PublicMedia | null>(null);
  const [files, setFiles] = useState<UploadedFileState[]>([]);
  const [descriptions, setDescriptions] = useState<Record<string, string>>({});
  const [isUploading, setIsUploading] = useState(false);

  const hasPendingUpload =
    files.some(
      (f) =>
        f.status === "pending" ||
        f.status === "uploading" ||
        f.status === "error",
    ) || isUploading;

  function openLightbox(index: number) {
    setLightboxIndex(index);
  }

  function closeLightbox() {
    setLightboxIndex(null);
  }

  function goPrevious() {
    setLightboxIndex((prev) => (prev !== null && prev > 0 ? prev - 1 : prev));
  }

  function goNext() {
    setLightboxIndex((prev) =>
      prev !== null && prev < media.length - 1 ? prev + 1 : prev,
    );
  }

  function handleSetAsImage(role: "profile" | "hero") {
    if (!setAsTarget) return;
    const item = setAsTarget;
    const patch =
      role === "profile"
        ? { profileImageUrl: item.url }
        : { heroImageUrl: item.url };
    updateHorse.mutate(
      { horseId, patch },
      {
        onSuccess: () => {
          toast.success(
            role === "profile" ? t("setAsProfileSuccess") : t("setAsHeroSuccess"),
          );
          setSetAsTarget(null);
        },
        onError: () =>
          toast.error(
            role === "profile" ? t("setAsProfileError") : t("setAsHeroError"),
          ),
      },
    );
  }

  function handleDelete() {
    if (!deleteTarget) return;

    deleteMutation.mutate(
      { mediaId: deleteTarget },
      {
        onSuccess: () => {
          toast.success(t("deleteSuccess"));
          setDeleteTarget(null);
          if (lightboxIndex !== null && lightboxIndex >= media.length - 1) {
            closeLightbox();
          }
        },
        onError: () => toast.error(t("deleteError")),
      },
    );
  }

  function handleRequestDeletion() {
    if (!deletionRequestTarget) return;

    deletionRequestMutation.mutate(
      { mediaId: deletionRequestTarget },
      {
        onSuccess: () => {
          toast.success(t("requestDeleteSuccess"));
          setDeletionRequestTarget(null);
        },
        onError: () => toast.error(t("requestDeleteError")),
      },
    );
  }

  function clearPendingUploads() {
    setFiles((prev) => {
      for (const f of prev) {
        if (f.preview?.startsWith("blob:")) {
          URL.revokeObjectURL(f.preview);
        }
      }
      return [];
    });
    setDescriptions({});
  }

  function handleUploadDialogOpenChange(open: boolean) {
    if (open) return;
    if (isUploading) return;
    clearPendingUploads();
  }

  function handleUpload() {
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
        fileIds: pendingFiles.map((f) => f.id),
        descriptions,
        sourceEntityType,
        sourceEntityId,
      },
      {
        onSuccess: () => {
          toast.success(t("uploadSuccess"));
          clearPendingUploads();
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

  if (isPending) {
    return <HorseMediaGallerySkeleton />;
  }

  if (isError) {
    return <p className="text-sm text-destructive">{t("galleryLoadFailed")}</p>;
  }

  return (
    <>
      <div className="grid grid-cols-4 gap-2 sm:grid-cols-5 md:grid-cols-6 lg:grid-cols-8">
        {canManageMedia ? (
          <div className="aspect-square w-full">
            <FileUpload
              variant="tile"
              showPreviewList={false}
              value={files}
              onChange={setFiles}
              accept="image/*,video/*"
              maxFiles={10}
              maxSizeBytes={10 * 1024 * 1024}
              disabled={isUploading}
              uploading={isUploading}
            />
          </div>
        ) : null}

        {media.map((item, index) => (
          <HorseMediaGalleryTile
            key={item.id}
            item={item}
            canManageMedia={canManageMedia}
            onOpen={() => openLightbox(index)}
            onToggleVisibility={
              canManageMedia
                ? () => {
                    toggleVisibilityMutation.mutate(
                      {
                        mediaId: item.id,
                        isVisibleOnHub: !item.isVisibleOnHub,
                      },
                      {
                        onSuccess: () => toast.success(t("visibilityUpdateSuccess")),
                        onError: () => toast.error(t("visibilityUpdateError")),
                      },
                    );
                  }
                : undefined
            }
            onRequestDelete={
              canManageMedia ? () => setDeleteTarget(item.id) : undefined
            }
            onRequestDeletion={
              canManageMedia ? undefined : () => setDeletionRequestTarget(item.id)
            }
            onRequestSetAs={canManageMedia ? () => setSetAsTarget(item) : undefined}
            setAsPending={updateHorse.isPending}
          />
        ))}
      </div>

      <PendingDialog
        open={hasPendingUpload}
        onOpenChange={handleUploadDialogOpenChange}
        title={t("uploadReviewTitle")}
        description={t("uploadReviewDescription")}
        pending={isUploading}
        className="max-h-[min(90vh,36rem)] overflow-y-auto"
      >
        <PendingUploadDialogContent
          files={files}
          descriptions={descriptions}
          isUploading={isUploading}
          onDescriptionsChange={setDescriptions}
          onFilesChange={setFiles}
          onUpload={handleUpload}
          uploadLabel={t("uploadButton")}
          uploadingLabel={t("uploading")}
          descriptionPlaceholder={t("descriptionPlaceholder")}
          removeLabel={tCommon("remove")}
        />
      </PendingDialog>

      {lightboxIndex !== null && (
        <HorseMediaLightboxDialog
          items={media}
          currentIndex={lightboxIndex}
          open={lightboxIndex !== null}
          onOpenChange={(open) => {
            if (!open) closeLightbox();
          }}
          onPrevious={goPrevious}
          onNext={goNext}
          onToggleVisibility={
            canManageMedia
              ? () => {
                  const item = media[lightboxIndex];
                  if (!item) return;
                  toggleVisibilityMutation.mutate(
                    {
                      mediaId: item.id,
                      isVisibleOnHub: !item.isVisibleOnHub,
                    },
                    {
                      onSuccess: () => toast.success(t("visibilityUpdateSuccess")),
                      onError: () => toast.error(t("visibilityUpdateError")),
                    },
                  );
                }
              : undefined
          }
          onRequestDelete={
            canManageMedia
              ? () => {
                  const item = media[lightboxIndex];
                  if (!item) return;
                  setDeleteTarget(item.id);
                }
              : undefined
          }
          onRequestSetAs={
            canManageMedia
              ? () => {
                  const item = media[lightboxIndex];
                  if (!item || item.type !== "image") return;
                  setSetAsTarget(item);
                }
              : undefined
          }
          setAsPending={updateHorse.isPending}
        />
      )}

      <HorseMediaSetAsDialog
        open={setAsTarget !== null}
        onOpenChange={(open) => {
          if (!open) setSetAsTarget(null);
        }}
        isPending={updateHorse.isPending}
        onSetAsProfile={() => handleSetAsImage("profile")}
        onSetAsHero={() => handleSetAsImage("hero")}
      />

      <ConfirmDeleteDialog
        open={deleteTarget !== null}
        onOpenChange={(open) => {
          if (!open) setDeleteTarget(null);
        }}
        title={t("deleteConfirm")}
        description={t("deleteConfirmDescription")}
        confirmLabel={t("delete")}
        cancelLabel={tCommon("cancel")}
        isPending={deleteMutation.isPending}
        onConfirm={handleDelete}
      />

      <ConfirmDeleteDialog
        open={deletionRequestTarget !== null}
        onOpenChange={(open) => {
          if (!open) setDeletionRequestTarget(null);
        }}
        title={t("requestDeleteConfirm")}
        description={t("requestDeleteConfirmDescription")}
        confirmLabel={t("requestDelete")}
        cancelLabel={tCommon("cancel")}
        isPending={deletionRequestMutation.isPending}
        onConfirm={handleRequestDeletion}
      />
    </>
  );
}

function HorseMediaGallerySkeleton() {
  return (
    <div className="relative w-full h-full">
      <div className="absolute inset-0 z-10 flex items-center justify-center">
        <Spinner className="size-6" />
      </div>
      <Skeleton className="h-full w-full rounded-lg" />
    </div>
  );
}
