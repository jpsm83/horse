/**
 * HorseHubPedigree — Hub tab sire/dam + bloodline card.
 *
 * Assembled by HubContent. Reads `horse.sections.pedigree` from useHorseView.
 * Linked parents render as EntityChip using the server-side `sireSummary` /
 * `damSummary` (no per-parent client fetch); name-only parents render as text.
 */

"use client";

import { useTranslations } from "next-intl";

import { EntityChip } from "@/components/shared/entity-chip.tsx";
import { Section } from "@/components/shared/section.tsx";
import type {
  HorseHubPedigreeParentSummary,
  HorseViewDto,
} from "@/lib/services/horseService.ts";
import { cn } from "@/lib/utils";

type HorseHubPedigreeProps = {
  horse: HorseViewDto;
  className?: string;
};

function ParentRow({
  label,
  name,
  summary,
}: {
  label: string;
  name?: string;
  summary?: HorseHubPedigreeParentSummary;
}) {
  if (!summary && !name?.trim()) return null;

  return (
    <div className="flex flex-col gap-1.5">
      <p className="text-xs uppercase tracking-wide text-muted-foreground">
        {label}
      </p>
      {summary ? (
        <EntityChip
          entityType="horse"
          entityId={summary.horseId}
          title={summary.name ?? name?.trim() ?? label}
          subtitle={undefined}
          imageUrl={summary.imageUrl}
          countryCode={summary.countryCode}
        />
      ) : (
        <p className="truncate text-sm font-medium text-foreground">
          {name}
        </p>
      )}
    </div>
  );
}

export function HorseHubPedigree({ horse, className }: HorseHubPedigreeProps) {
  const t = useTranslations("horseHub");
  const pedigree = horse.sections.pedigree;
  if (!pedigree) return null;

  const hasSire = Boolean(pedigree.sireHorseId || pedigree.sireName?.trim());
  const hasDam = Boolean(pedigree.damHorseId || pedigree.damName?.trim());
  const bloodlineNotes = pedigree.bloodlineNotes?.trim();
  const isEmpty = !hasSire && !hasDam && !bloodlineNotes;

  return (
    <Section title={t("pedigree")} className={cn(className)}>
      {isEmpty ? (
        <p className="text-sm text-muted-foreground">{t("pedigreeEmpty")}</p>
      ) : (
        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-3">
            <ParentRow
              label={t("sire")}
              name={pedigree.sireName}
              summary={pedigree.sireSummary}
            />
            <ParentRow
              label={t("dam")}
              name={pedigree.damName}
              summary={pedigree.damSummary}
            />
          </div>
          {bloodlineNotes ? (
            <div className="flex flex-col gap-1.5 border-t border-border pt-4">
              <p className="text-xs uppercase tracking-wide text-muted-foreground">
                {t("bloodlineNotes")}
              </p>
              <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                {bloodlineNotes}
              </p>
            </div>
          ) : null}
        </div>
      )}
    </Section>
  );
}
