/**
 * HorseHubPedigree — Hub tab sire/dam + bloodline card (placeholder).
 *
 * Assembled by HubContent. Pedigree parents and notes will be wired in a
 * later pass — no horse props yet.
 */

"use client";

import { useTranslations } from "next-intl";

import { Section } from "@/components/shared/section.tsx";
import { Skeleton } from "@/components/ui/skeleton.tsx";
import { cn } from "@/lib/utils";

type HorseHubPedigreeProps = {
  className?: string;
};

export function HorseHubPedigree({ className }: HorseHubPedigreeProps) {
  const t = useTranslations("horseHub");

  return (
    <Section title={t("pedigree")} className={cn(className)}>
      <div className="flex flex-col gap-4">
        <div className="flex flex-col gap-3">
          {Array.from({ length: 2 }).map((_, index) => (
            <div key={index} className="flex items-center gap-3">
              <Skeleton className="size-10 shrink-0 rounded-full" />
              <div className="flex min-w-0 flex-1 flex-col gap-1.5">
                <Skeleton className="h-4 w-28" />
                <Skeleton className="h-3 w-40" />
              </div>
            </div>
          ))}
        </div>
        <div className="flex flex-col gap-2 border-t border-border pt-4">
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-5/6" />
        </div>
      </div>
      <p className="sr-only">{t("placeholder")}</p>
    </Section>
  );
}
