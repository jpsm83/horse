/**
 * HorseHubPeople — Hub tab owner / co-owners / representatives card (placeholder).
 *
 * Assembled by HubContent. People list and EntityChips will be wired in a
 * later pass — no horse props yet.
 */

"use client";

import { useTranslations } from "next-intl";

import { Section } from "@/components/shared/section.tsx";
import { Skeleton } from "@/components/ui/skeleton.tsx";
import { cn } from "@/lib/utils";

type HorseHubPeopleProps = {
  className?: string;
};

export function HorseHubPeople({ className }: HorseHubPeopleProps) {
  const t = useTranslations("horseHub");

  return (
    <Section title={t("people")} className={cn(className)}>
      <div className="flex flex-col gap-4">
        {Array.from({ length: 3 }).map((_, index) => (
          <div key={index} className="flex flex-col gap-2">
            <Skeleton className="h-3 w-20" />
            <div className="flex items-center gap-3">
              <Skeleton className="size-10 shrink-0 rounded-full" />
              <div className="flex min-w-0 flex-1 flex-col gap-1.5">
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-3 w-44" />
              </div>
            </div>
          </div>
        ))}
      </div>
      <p className="sr-only">{t("placeholder")}</p>
    </Section>
  );
}
