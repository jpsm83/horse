/**
 * HorseHubAbout — Hub tab metadata / identity details card (placeholder).
 *
 * Assembled by HubContent. Breed, sex, color, height, birthday, registry
 * fields, etc. will be wired in a later pass — no horse props yet.
 */

"use client";

import { useTranslations } from "next-intl";

import { Section } from "@/components/shared/section.tsx";
import { Skeleton } from "@/components/ui/skeleton.tsx";
import { cn } from "@/lib/utils";

type HorseHubAboutProps = {
  className?: string;
};

export function HorseHubAbout({ className }: HorseHubAboutProps) {
  const t = useTranslations("horseHub");

  return (
    <Section title={t("about")} className={cn(className)}>
      <div className="flex flex-col gap-3">
        {Array.from({ length: 6 }).map((_, index) => (
          <div key={index} className="flex items-center gap-3">
            <Skeleton className="size-4 shrink-0 rounded-sm" />
            <Skeleton className="h-4 flex-1" />
          </div>
        ))}
      </div>
      <p className="sr-only">{t("placeholder")}</p>
    </Section>
  );
}
