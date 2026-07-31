/**
 * HorseHubDisciplines — Hub tab discipline tags card (placeholder).
 *
 * Assembled by HubContent. Tag list will be wired in a later pass —
 * no horse props yet.
 */

"use client";

import { useTranslations } from "next-intl";

import { Section } from "@/components/shared/section.tsx";
import { Skeleton } from "@/components/ui/skeleton.tsx";
import { cn } from "@/lib/utils";

type HorseHubDisciplinesProps = {
  className?: string;
};

export function HorseHubDisciplines({ className }: HorseHubDisciplinesProps) {
  const t = useTranslations("horseHub");

  return (
    <Section title={t("disciplines")} className={cn(className)}>
      <div className="flex flex-wrap gap-2">
        {Array.from({ length: 4 }).map((_, index) => (
          <Skeleton key={index} className="h-7 w-20 rounded-md" />
        ))}
      </div>
      <p className="sr-only">{t("placeholder")}</p>
    </Section>
  );
}
