"use client";

import { useTranslations } from "next-intl";

import type { HorseHubIdentitySection } from "@/lib/services/horseService.ts";

type HorseHubStatsProps = {
  identity: HorseHubIdentitySection;
};

export function HorseHubStats({ identity }: HorseHubStatsProps) {
  const t = useTranslations("horseHub");

  const stats = [
    identity.age != null && { label: t("age"), value: t("ageYears", { count: identity.age }) },
    identity.color && { label: t("color"), value: identity.color },
    identity.heightHands != null && {
      label: t("height"),
      value: t("heightHands", { value: identity.heightHands }),
    },
  ].filter(Boolean) as { label: string; value: string }[];

  const disciplines = identity.disciplines ?? [];

  if (stats.length === 0 && disciplines.length === 0) return null;

  return (
    <div className="flex flex-col gap-3">
      {stats.length > 0 && (
        <dl className="flex flex-wrap gap-3">
          {stats.map(({ label, value }) => (
            <div
              key={label}
              className="flex flex-col gap-0.5 rounded-lg border border-border bg-muted/40 px-4 py-2 min-w-[90px]"
            >
              <dt className="text-xs text-muted-foreground">{label}</dt>
              <dd className="text-sm font-semibold">{value}</dd>
            </div>
          ))}
        </dl>
      )}
      {disciplines.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {disciplines.map((d) => (
            <span
              key={d}
              className="rounded-full border border-border bg-primary/10 px-3 py-0.5 text-xs font-medium text-primary"
            >
              {d}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}
