/**
 * HorseHubDescription — Hub tab biography / description card (placeholder).
 *
 * Assembled by HubContent. Description text will be wired in a later pass —
 * no horse props yet.
 */

"use client";

import { useTranslations } from "next-intl";

import { Section } from "@/components/shared/section.tsx";
import { Skeleton } from "@/components/ui/skeleton.tsx";
import { cn } from "@/lib/utils";

type HorseHubDescriptionProps = {
  className?: string;
};

export function HorseHubDescription({ className }: HorseHubDescriptionProps) {
  const t = useTranslations("horseHub");

  return (
    <Section title={t("description")} className={cn(className)}>
      <div className="flex flex-col gap-2">
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-3/4" />
      </div>
      <p className="sr-only">{t("placeholder")}</p>
    </Section>
  );
}
