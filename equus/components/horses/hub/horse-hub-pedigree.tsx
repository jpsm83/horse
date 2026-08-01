/**
 * HorseHubPedigree — Hub tab sire/dam + bloodline card.
 *
 * Assembled by HubContent. Reads `horse.sections.pedigree` from useHorseView.
 * Linked parents use EntityChip (hub link); name-only parents render as text.
 */

"use client";

import { useTranslations } from "next-intl";

import { EntityChip } from "@/components/shared/entity-chip.tsx";
import { Section } from "@/components/shared/section.tsx";
import { useHorseView } from "@/hooks/queries/useHorse.ts";
import type { HorseViewDto } from "@/lib/services/horseService.ts";
import { cn } from "@/lib/utils";

type HorseHubPedigreeProps = {
  horse: HorseViewDto;
  className?: string;
};

type HubPedigreeParentChipProps = {
  horseId: string;
  fallbackName: string;
};

/** Resolves parent horse view → EntityChip (keeps EntityChip fetch-free). */
function HubPedigreeParentChip({
  horseId,
  fallbackName,
}: HubPedigreeParentChipProps) {
  const { data: view } = useHorseView(horseId);
  const parent = view?.horse;
  const title = parent?.name ?? fallbackName;
  const imageUrl = parent?.profileImageUrl;
  const countryCode =
    parent?.sections?.identity?.countryOfBirth ?? parent?.countryOfBirth;
  const ownerEmail =
    parent?.adminTeam?.find((m) => m.type === "owner")?.email ||
    parent?.adminTeam?.find((m) => m.type === "responsible")?.email ||
    parent?.adminTeam?.[0]?.email;

  return (
    <EntityChip
      entityType="horse"
      entityId={horseId}
      title={title}
      subtitle={ownerEmail || undefined}
      imageUrl={imageUrl}
      countryCode={countryCode}
    />
  );
}

function ParentRow({
  label,
  horseId,
  name,
}: {
  label: string;
  horseId?: string;
  name?: string;
}) {
  if (!horseId && !name?.trim()) return null;

  return (
    <div className="flex flex-col gap-1.5">
      <p className="text-xs uppercase tracking-wide text-muted-foreground">
        {label}
      </p>
      {horseId ? (
        <HubPedigreeParentChip
          horseId={horseId}
          fallbackName={name?.trim() || label}
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
              horseId={pedigree.sireHorseId}
              name={pedigree.sireName}
            />
            <ParentRow
              label={t("dam")}
              horseId={pedigree.damHorseId}
              name={pedigree.damName}
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
