"use client";

import { useTranslations } from "next-intl";

import type { HorseHubIdentificationSection } from "@/lib/services/horseService.ts";

type HorseHubIdentificationProps = {
  identification: HorseHubIdentificationSection;
};

export function HorseHubIdentification({ identification }: HorseHubIdentificationProps) {
  const t = useTranslations("horseHub");

  const rows = [
    identification.registryId && { label: t("registryId"), value: identification.registryId },
    identification.microchipId && { label: t("microchipId"), value: identification.microchipId },
    identification.passportNumber && { label: t("passportNumber"), value: identification.passportNumber },
  ].filter(Boolean) as { label: string; value: string }[];

  if (rows.length === 0) {
    return <p className="text-sm text-muted-foreground">{t("identificationEmpty")}</p>;
  }

  return (
    <dl className="flex flex-col divide-y divide-border">
      {rows.map(({ label, value }) => (
        <div key={label} className="flex items-center justify-between gap-4 py-2">
          <dt className="text-sm text-muted-foreground">{label}</dt>
          <dd className="text-sm font-medium font-mono">{value}</dd>
        </div>
      ))}
    </dl>
  );
}
