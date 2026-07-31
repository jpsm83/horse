/**
 * HorseHubGallery — Hub tab media gallery card (placeholder).
 *
 * Assembled by HubContent. Media grid, filters, and lightbox will be wired
 * in a later pass — no horse props yet.
 */

"use client";

import { useTranslations } from "next-intl";

import { Section } from "@/components/shared/section.tsx";
import { Skeleton } from "@/components/ui/skeleton.tsx";
import { cn } from "@/lib/utils";

type HorseHubGalleryProps = {
  className?: string;
};

export function HorseHubGallery({ className }: HorseHubGalleryProps) {
  const t = useTranslations("horseHub");

  return (
    <Section title={t("media")} className={cn("flex-1", className)}>
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
        {Array.from({ length: 9 }).map((_, index) => (
          <Skeleton key={index} className="aspect-square w-full rounded-md" />
        ))}
      </div>
      <p className="sr-only">{t("placeholder")}</p>
    </Section>
  );
}
