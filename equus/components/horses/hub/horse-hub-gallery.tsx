"use client";

import { useTranslations } from "next-intl";
import { useState } from "react";

import type { HorseHubGalleryItem } from "@/lib/services/horseService.ts";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog.tsx";

type HorseHubGalleryProps = {
  gallery: HorseHubGalleryItem[];
};

export function HorseHubGallery({ gallery }: HorseHubGalleryProps) {
  const t = useTranslations("horseHub");
  const [lightbox, setLightbox] = useState<HorseHubGalleryItem | null>(null);

  if (gallery.length === 0) {
    return <p className="text-sm text-muted-foreground">{t("galleryEmpty")}</p>;
  }

  return (
    <>
      <ul className="grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-4">
        {gallery.map((item) => (
          <li key={item.id}>
            <button
              type="button"
              className="group w-full overflow-hidden rounded-lg border border-border bg-muted/30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
              onClick={() => setLightbox(item)}
            >
              {item.type === "video" ? (
                <div className="relative aspect-square flex items-center justify-center bg-muted">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  {item.thumbnailUrl ? (
                    <img
                      src={item.thumbnailUrl}
                      alt={item.title ?? t("galleryItemAlt")}
                      className="aspect-square w-full object-cover group-hover:opacity-80 transition-opacity"
                    />
                  ) : (
                    <span className="text-3xl">▶</span>
                  )}
                </div>
              ) : (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={item.thumbnailUrl ?? item.url}
                  alt={item.title ?? t("galleryItemAlt")}
                  className="aspect-square w-full object-cover group-hover:opacity-80 transition-opacity"
                />
              )}
              {item.title ? (
                <p className="truncate px-2 py-1 text-xs text-muted-foreground text-left">
                  {item.title}
                </p>
              ) : null}
            </button>
          </li>
        ))}
      </ul>

      <Dialog open={!!lightbox} onOpenChange={(open) => { if (!open) setLightbox(null); }}>
        <DialogContent className="max-w-3xl p-2">
          <DialogTitle className="sr-only">{lightbox?.title ?? t("galleryItemAlt")}</DialogTitle>
          {lightbox && lightbox.type === "video" ? (
            <video
              src={lightbox.url}
              controls
              className="w-full max-h-[80vh] rounded-md object-contain"
            />
          ) : lightbox ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={lightbox.url}
              alt={lightbox.title ?? t("galleryItemAlt")}
              className="w-full max-h-[80vh] rounded-md object-contain"
            />
          ) : null}
        </DialogContent>
      </Dialog>
    </>
  );
}
