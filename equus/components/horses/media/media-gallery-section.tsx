"use client";

import { useState, useCallback } from "react";
import { useTranslations } from "next-intl";
import { Trash2, Play, ImageIcon } from "lucide-react";

import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useHorseMedia, useDeleteHorseMedia } from "@/hooks/queries/useHorseMedia.ts";
import { useAppToast } from "@/hooks/use-app-toast.ts";
import { LightboxDialog } from "@/components/horses/media/lightbox-dialog.tsx";
import { extractStoragePublicId } from "@/lib/cloudinary/extractStoragePublicId.ts";

type MediaGallerySectionProps = {
  horseId: string;
};

export function MediaGallerySection({ horseId }: MediaGallerySectionProps) {
  const t = useTranslations("horseMedia");
  const tCommon = useTranslations("common");
  const toast = useAppToast();
  const { data: media = [], isPending } = useHorseMedia(horseId);
  const deleteMutation = useDeleteHorseMedia(horseId);

  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);

  const openLightbox = useCallback((index: number) => setLightboxIndex(index), []);
  const closeLightbox = useCallback(() => setLightboxIndex(null), []);

  const goPrevious = useCallback(() => {
    setLightboxIndex((prev) => (prev !== null && prev > 0 ? prev - 1 : prev));
  }, []);

  const goNext = useCallback(() => {
    setLightboxIndex((prev) =>
      prev !== null && prev < media.length - 1 ? prev + 1 : prev,
    );
  }, [media.length]);

  function handleDelete() {
    if (!deleteTarget) return;
    const item = media.find((m) => m.id === deleteTarget);
    const storagePublicId = item?.url
      ? extractStoragePublicId(item.thumbnailUrl ?? item.url)
      : null;

    deleteMutation.mutate(
      { mediaId: deleteTarget, storagePublicId },
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

  if (isPending) {
    return (
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4">
        {Array.from({ length: 8 }).map((_, i) => (
          <Skeleton key={i} className="aspect-square w-full rounded-lg" />
        ))}
      </div>
    );
  }

  if (media.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <ImageIcon className="size-12 text-muted-foreground/40 mb-3" />
        <p className="text-sm text-muted-foreground">{t("noMedia")}</p>
      </div>
    );
  }

  return (
    <>
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4">
        {media.map((item, index) => (
          <div
            key={item.id}
            className="group relative aspect-square overflow-hidden rounded-lg border cursor-pointer"
            onClick={() => openLightbox(index)}
          >
            {item.type === "video" && (
              <div className="absolute inset-0 z-10 flex items-center justify-center">
                <div className="flex items-center justify-center size-12 rounded-full bg-black/50">
                  <Play className="size-6 text-white ml-0.5" />
                </div>
              </div>
            )}

            {item.type === "image" || item.thumbnailUrl ? (
              <img
                src={item.thumbnailUrl ?? item.url}
                alt={item.title ?? ""}
                className="size-full object-cover transition-transform group-hover:scale-105"
                loading="lazy"
              />
            ) : (
              <div className="flex size-full items-center justify-center bg-muted">
                <ImageIcon className="size-8 text-muted-foreground" />
              </div>
            )}

            <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/60 to-transparent p-2">
              {item.title && (
                <p className="text-xs text-white truncate">{item.title}</p>
              )}
            </div>

            <Button
              variant="ghost"
              size="icon"
              className="absolute top-1 right-1 z-20 size-7 rounded-full bg-black/50 text-white opacity-0 transition-opacity group-hover:opacity-100 hover:bg-black/70 hover:text-white"
              onClick={(e) => {
                e.stopPropagation();
                setDeleteTarget(item.id);
              }}
            >
              <Trash2 className="size-3.5" />
            </Button>
          </div>
        ))}
      </div>

      {lightboxIndex !== null && (
        <LightboxDialog
          items={media}
          currentIndex={lightboxIndex}
          open={lightboxIndex !== null}
          onOpenChange={closeLightbox}
          onPrevious={goPrevious}
          onNext={goNext}
        />
      )}

      <AlertDialog
        open={deleteTarget !== null}
        onOpenChange={(open) => {
          if (!open) setDeleteTarget(null);
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t("deleteConfirm")}</AlertDialogTitle>
            <AlertDialogDescription>
              {t("deleteConfirmDescription")}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{tCommon("cancel")}</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={deleteMutation.isPending}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleteMutation.isPending ? (
                <span className="flex items-center gap-1">
                  <span className="size-3 animate-spin rounded-full border-2 border-current border-t-transparent" />
                  {t("delete")}
                </span>
              ) : (
                t("delete")
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
