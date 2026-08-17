/**
 * HorseHubDisciplines — Hub tab discipline tags as colored pills.
 *
 * Assembled by HubContent. Reads disciplines from the Layer-2 `identity` section only.
 * Colors use `--discipline-*` tokens from globals.css (default + onyx).
 */

"use client";

import { useTranslations } from "next-intl";

import { Section } from "@/components/shared/section.tsx";
import { Badge } from "@/components/ui/badge.tsx";
import type { HorseViewDto } from "@/lib/services/horseService.ts";
import { cn } from "@/lib/utils";
import { horseDisciplineEnums } from "@/utils/enums.ts";

type HorseHubDisciplinesProps = {
  horse: HorseViewDto;
  className?: string;
};

/** Maps enum → `.discipline-badge-*` class (semantic tokens in globals.css). */
const DISCIPLINE_BADGE_CLASS: Record<
  (typeof horseDisciplineEnums)[number],
  string
> = {
  Jumping: "discipline-badge-jumping",
  Dressage: "discipline-badge-dressage",
  Eventing: "discipline-badge-eventing",
  Racing: "discipline-badge-racing",
  Breeding: "discipline-badge-breeding",
  Rehabilitation: "discipline-badge-rehabilitation",
  Leisure: "discipline-badge-leisure",
  Western: "discipline-badge-western",
  Endurance: "discipline-badge-endurance",
  Driving: "discipline-badge-driving",
  Other: "discipline-badge-other",
};

function isKnownDiscipline(
  value: string,
): value is (typeof horseDisciplineEnums)[number] {
  return (horseDisciplineEnums as readonly string[]).includes(value);
}

export function HorseHubDisciplines({
  horse,
  className,
}: HorseHubDisciplinesProps) {
  const t = useTranslations("horseHub");
  const tProfile = useTranslations("horseProfile");

  const identity = horse.sections.identity;
  if (!identity) return null;

  const disciplines = identity.disciplines ?? [];

  return (
    <Section title={t("disciplines")} className={cn(className)}>
      {disciplines.length === 0 ? (
        <p className="text-sm text-muted-foreground">{t("disciplinesEmpty")}</p>
      ) : (
        <div className="flex flex-wrap gap-2">
          {disciplines.map((discipline) => {
            const badgeClass = isKnownDiscipline(discipline)
              ? DISCIPLINE_BADGE_CLASS[discipline]
              : DISCIPLINE_BADGE_CLASS.Other;
            const label = isKnownDiscipline(discipline)
              ? tProfile(`disciplineOptions.${discipline}`)
              : discipline;

            return (
              <Badge
                key={discipline}
                variant="outline"
                className={cn(
                  "h-7 rounded-full border-transparent px-3 text-xs font-medium",
                  badgeClass,
                )}
              >
                {label}
              </Badge>
            );
          })}
        </div>
      )}
    </Section>
  );
}
