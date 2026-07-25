"use client";

import { useTranslations } from "next-intl";

import type { HorseViewDto } from "@/lib/services/horseService.ts";

type HorseHubHeroProps = {
  horse: Pick<HorseViewDto, "name" | "breed" | "sex" | "profileImageUrl">;
};

export function HorseHubHero({ horse }: HorseHubHeroProps) {
  const tCommon = useTranslations("common");
  const horseName = horse.name ?? tCommon("horseFallback");
  const subtitle = [horse.breed, horse.sex].filter(Boolean).join(" · ");

  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-end">
      {horse.profileImageUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={horse.profileImageUrl}
          alt={horseName}
          className="h-28 w-28 rounded-2xl object-cover border border-border shadow-sm sm:h-32 sm:w-32"
        />
      ) : (
        <div className="flex h-28 w-28 items-center justify-center rounded-2xl bg-muted border border-border sm:h-32 sm:w-32">
          <span className="text-4xl select-none">🐴</span>
        </div>
      )}
      <div className="flex flex-col gap-1">
        <h1 className="text-3xl font-bold tracking-tight leading-tight">{horseName}</h1>
        {subtitle ? <p className="text-base text-muted-foreground">{subtitle}</p> : null}
      </div>
    </div>
  );
}
