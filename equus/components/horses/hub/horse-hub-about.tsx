"use client";

import { useTranslations } from "next-intl";

import type { HorseHubAboutSection } from "@/lib/services/horseService.ts";

type HorseHubAboutProps = {
  about: HorseHubAboutSection;
};

export function HorseHubAbout({ about }: HorseHubAboutProps) {
  const t = useTranslations("horseHub");

  if (!about.description) {
    return <p className="text-sm text-muted-foreground">{t("aboutEmpty")}</p>;
  }

  return (
    <p className="text-sm leading-relaxed whitespace-pre-wrap text-foreground">
      {about.description}
    </p>
  );
}
