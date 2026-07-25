"use client";

import { useTranslations } from "next-intl";

import type { HorseHubPedigreeSection } from "@/lib/services/horseService.ts";

type HorseHubPedigreeProps = {
  pedigree: HorseHubPedigreeSection;
};

export function HorseHubPedigree({ pedigree }: HorseHubPedigreeProps) {
  const t = useTranslations("horseHub");

  const hasData = pedigree.sireName || pedigree.damName || pedigree.bloodlineNotes;

  if (!hasData) {
    return <p className="text-sm text-muted-foreground">{t("pedigreeEmpty")}</p>;
  }

  return (
    <div className="flex flex-col gap-3">
      {(pedigree.sireName || pedigree.damName) && (
        <dl className="flex flex-wrap gap-3">
          {pedigree.sireName && (
            <div className="flex flex-col gap-0.5 rounded-lg border border-border bg-muted/40 px-4 py-2 min-w-[120px]">
              <dt className="text-xs text-muted-foreground">{t("sire")}</dt>
              <dd className="text-sm font-semibold">{pedigree.sireName}</dd>
            </div>
          )}
          {pedigree.damName && (
            <div className="flex flex-col gap-0.5 rounded-lg border border-border bg-muted/40 px-4 py-2 min-w-[120px]">
              <dt className="text-xs text-muted-foreground">{t("dam")}</dt>
              <dd className="text-sm font-semibold">{pedigree.damName}</dd>
            </div>
          )}
        </dl>
      )}
      {pedigree.bloodlineNotes && (
        <p className="text-sm leading-relaxed text-muted-foreground">{pedigree.bloodlineNotes}</p>
      )}
    </div>
  );
}
