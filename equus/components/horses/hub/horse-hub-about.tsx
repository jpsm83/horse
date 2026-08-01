/**
 * HorseHubAbout — Hub tab About card. Shows the horse profile description
 * when the Layer-2 `about` section allows it; renders nothing otherwise.
 *
 * Assembled by HubContent. Reads `horse.sections.about` from useHorseView.
 */

"use client";

import { useTranslations } from "next-intl";

import { Section } from "@/components/shared/section.tsx";
import type { HorseViewDto } from "@/lib/services/horseService.ts";
import { cn } from "@/lib/utils";

type HorseHubAboutProps = {
  horse: HorseViewDto;
  className?: string;
};

export function HorseHubAbout({ horse, className }: HorseHubAboutProps) {
  const t = useTranslations("horseHub");
  const about = horse.sections.about;
  if (!about) return null;

  return (
    <Section title={t("about")} className={cn(className)}>
      <p className="text-sm text-muted-foreground">
        {about.description?.trim() ? about.description : t("aboutEmpty")}
      </p>
    </Section>
  );
}
