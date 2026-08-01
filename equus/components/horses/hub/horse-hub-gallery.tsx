/**
 * HorseHubGallery — Hub Media section: All/Photos/Videos tabs, responsive
 * thumbnail grid, pagination, and view-only lightbox.
 *
 * Fetches via useHorseHubGallery (GET …/hub-gallery) — page size follows
 * breakpoints (2×3=6, 3×3=9, 4×3=12).
 */

"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { ChevronLeft, ChevronRight, Play } from "lucide-react";

import { HorseMediaLightboxDialog } from "@/components/horses/media/horse-media-lightbox-dialog.tsx";
import { Section } from "@/components/shared/section.tsx";
import { Button } from "@/components/ui/button.tsx";
import { Skeleton } from "@/components/ui/skeleton.tsx";
import { useHorseHubGallery } from "@/hooks/queries/useHorse.ts";
import type { HubGalleryTypeFilter } from "@/lib/services/mediaService.ts";
import { cn } from "@/lib/utils";

type HorseHubGalleryProps = {
  horseId: string;
  className?: string;
};

function resolvePageSize(width: number): number {
  if (width >= 1024) return 12; // lg: 4 cols × 3 rows
  if (width >= 640) return 9; // sm: 3 × 3
  return 6; // 2 × 3
}

export function HorseHubGallery({ horseId, className }: HorseHubGalleryProps) {
  const t = useTranslations("horseHub");
  const [type, setType] = useState<HubGalleryTypeFilter>("all");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(() =>
    typeof window !== "undefined" ? resolvePageSize(window.innerWidth) : 12,
  );
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);

  useEffect(() => {
    function updatePageSize() {
      setPageSize(resolvePageSize(window.innerWidth));
    }
    updatePageSize();
    window.addEventListener("resize", updatePageSize);
    return () => window.removeEventListener("resize", updatePageSize);
  }, []);

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

  useEffect(() => {
    if (page > totalPages) setPage(totalPages);
  }, [page, totalPages]);

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
        ) : items.length === 0 ? (
          <p className="text-sm text-muted-foreground">{t("mediaEmpty")}</p>
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
              disabled={page <= 1}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              aria-label={t("mediaPrev")}
            >
              <ChevronLeft className="size-4" />
              {t("mediaPrev")}
            </Button>
            <span className="text-sm text-muted-foreground">
              {t("mediaPage", { page, total: totalPages })}
            </span>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              disabled={page >= totalPages}
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
