/**
 * HorseHubGallery — Hub Media section: All/Photos/Videos tabs, responsive
 * thumbnail grid, pagination, and view-only lightbox.
 *
 * Fetches via useHorseHubGallery (GET …/hub-gallery) — page size follows
 * breakpoints (2×3=6, 3×3=9, 4×3=12). Page size follows breakpoints via
 * `useHubGalleryPageSize` (matchMedia + useSyncExternalStore).
 */

"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { ChevronLeft, ChevronRight, ImageIcon, Play, VideoIcon } from "lucide-react";

import { HorseMediaLightboxDialog } from "@/components/horses/media/horse-media-lightbox-dialog.tsx";
import { Section } from "@/components/shared/section.tsx";
import { Button } from "@/components/ui/button.tsx";
import { Skeleton } from "@/components/ui/skeleton.tsx";
import { useHorseHubGallery } from "@/hooks/queries/useHorse.ts";
import { useHubGalleryPageSize } from "@/hooks/use-hub-gallery-page-size.ts";
import type { HubGalleryTypeFilter } from "@/lib/services/mediaService.ts";
import { cn } from "@/lib/utils";

type HorseHubGalleryProps = {
  horseId: string;
  className?: string;
};

/** Centered, icon-led empty state for the Hub media grid (type-aware copy). */
function HubGalleryEmptyState({ type }: { type: HubGalleryTypeFilter }) {
  const t = useTranslations("horseHub");
  const EmptyIcon = type === "videos" ? VideoIcon : ImageIcon;
  const message =
    type === "photos"
      ? t("mediaEmptyPhotos")
      : type === "videos"
        ? t("mediaEmptyVideos")
        : t("mediaEmpty");

  return (
    <div className="flex min-h-0 flex-1 flex-col items-center justify-center gap-3 py-10 text-center">
      <div className="flex size-12 items-center justify-center rounded-full bg-muted">
        <EmptyIcon className="size-6 text-muted-foreground" aria-hidden />
      </div>
      <p className="text-sm font-medium text-foreground">{message}</p>
    </div>
  );
}

export function HorseHubGallery({ horseId, className }: HorseHubGalleryProps) {
  const t = useTranslations("horseHub");
  const [type, setType] = useState<HubGalleryTypeFilter>("all");
  const [page, setPage] = useState(1);
  const pageSize = useHubGalleryPageSize();
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);

  useEffect(() => {
    setPage(1);
  }, [pageSize]);

  const { data, isPending, isError } = useHorseHubGallery(horseId, {
    page,
    pageSize,
    type,
  });

  const items = data?.items ?? [];
  const total = data?.total ?? 0;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  // Clamp the page during render (never setState in an effect). If a stale page
  // lands past the last page, the query returns empty items and the pagination
  // row below re-anchors the user instead of showing a false "no media".
  const safePage = Math.min(page, totalPages);
  const outOfRange = total > 0 && items.length === 0;

  function selectType(next: HubGalleryTypeFilter) {
    setType(next);
    setPage(1);
    setLightboxIndex(null);
  }

  const tabs: { id: HubGalleryTypeFilter; label: string }[] = [
    { id: "all", label: t("mediaAll") },
    { id: "photos", label: t("mediaPhotos") },
    { id: "videos", label: t("mediaVideos") },
  ];

  return (
    <Section title={t("media")} className={cn("h-full min-h-0 flex-1", className)}>
      <div className="flex min-h-0 flex-1 flex-col gap-4">
        <div className="flex shrink-0 flex-wrap gap-2" role="tablist" aria-label={t("media")}>
          {tabs.map((tab) => {
            const active = type === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                role="tab"
                aria-selected={active}
                onClick={() => selectType(tab.id)}
                className={cn(
                  "relative rounded-full px-3 py-1.5 text-sm transition-colors",
                  active
                    ? "bg-muted font-medium text-foreground"
                    : "text-muted-foreground hover:text-foreground",
                )}
              >
                {tab.label}
                {active ? (
                  <span
                    className="absolute inset-x-3 -bottom-0.5 h-0.5 rounded-full bg-primary"
                    aria-hidden
                  />
                ) : null}
              </button>
            );
          })}
        </div>

        {isPending && items.length === 0 ? (
          <div className="grid min-h-0 flex-1 grid-cols-2 content-start gap-2 sm:grid-cols-3 lg:grid-cols-4">
            {Array.from({ length: pageSize }).map((_, index) => (
              <Skeleton key={index} className="aspect-square w-full rounded-md" />
            ))}
          </div>
        ) : isError ? (
          <p className="text-sm text-muted-foreground">{t("mediaLoadFailed")}</p>
        ) : outOfRange || items.length === 0 ? (
          <HubGalleryEmptyState type={type} />
        ) : (
          <div className="grid min-h-0 flex-1 grid-cols-2 content-start gap-2 sm:grid-cols-3 lg:grid-cols-4">
            {items.map((item, index) => (
              <button
                key={item.id}
                type="button"
                className="group relative aspect-square overflow-hidden rounded-md bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                onClick={() => setLightboxIndex(index)}
                aria-label={item.title ?? t("media")}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={item.thumbnailUrl ?? item.url}
                  alt={item.title ?? ""}
                  className="size-full object-cover transition-transform group-hover:scale-[1.02]"
                />
                {item.type === "video" ? (
                  <span className="pointer-events-none absolute bottom-1.5 right-1.5 flex items-center gap-1 rounded-full bg-overlay/60 px-1.5 py-0.5 text-overlay-foreground">
                    <Play className="size-3 fill-overlay-foreground" aria-hidden />
                  </span>
                ) : null}
              </button>
            ))}
          </div>
        )}

        {totalPages > 1 ? (
          <div className="flex shrink-0 items-center justify-center gap-4 pt-1">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              disabled={safePage <= 1}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              aria-label={t("mediaPrev")}
            >
              <ChevronLeft className="size-4" />
              {t("mediaPrev")}
            </Button>
            <span className="text-sm text-muted-foreground">
              {t("mediaPage", { page: safePage, total: totalPages })}
            </span>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              disabled={safePage >= totalPages}
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              aria-label={t("mediaNext")}
            >
              {t("mediaNext")}
              <ChevronRight className="size-4" />
            </Button>
          </div>
        ) : null}
      </div>

      {lightboxIndex != null && items.length > 0 ? (
        <HorseMediaLightboxDialog
          items={items}
          currentIndex={lightboxIndex}
          open={lightboxIndex != null}
          onOpenChange={(open) => {
            if (!open) setLightboxIndex(null);
          }}
          onPrevious={() =>
            setLightboxIndex((i) => (i != null && i > 0 ? i - 1 : i))
          }
          onNext={() =>
            setLightboxIndex((i) =>
              i != null && i < items.length - 1 ? i + 1 : i,
            )
          }
        />
      ) : null}
    </Section>
  );
}
