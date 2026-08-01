/**
 * HorseHubPeople — Hub tab owner / co-owners / representatives card.
 *
 * Assembled by HubContent. Reads ownership / coOwnerManagement /
 * proactiveRepresentatives from useHorseView. EntityChips link to user hubs.
 * Email subtitle only when available on owner-team adminTeam (not on hub DTOs).
 * Layout matches PEOPLE.png: uppercase group labels, divider-separated bands,
 * stacked EntityChips (no nested bordered group cards).
 */

"use client";

import { useTranslations } from "next-intl";

import { EntityChip } from "@/components/shared/entity-chip.tsx";
import { Section } from "@/components/shared/section.tsx";
import type {
  HorseHubMemberSummary,
  HorseViewDto,
} from "@/lib/services/horseService.ts";
import { cn } from "@/lib/utils";

type HorseHubPeopleProps = {
  horse: HorseViewDto;
  className?: string;
};

function PeopleGroup({
  label,
  members,
  emailByUserId,
  showDivider,
}: {
  label: string;
  members: HorseHubMemberSummary[];
  emailByUserId: Map<string, string>;
  showDivider: boolean;
}) {
  if (members.length === 0) return null;

  return (
    <div
      className={cn(
        "flex flex-col gap-2",
        showDivider && "border-t border-border pt-3",
      )}
    >
      <p className="text-xs uppercase tracking-wide text-muted-foreground">
        {label}
      </p>
      <div className="flex flex-col gap-2">
        {members.map((member) => (
          <EntityChip
            key={member.userId}
            entityType="user"
            entityId={member.userId}
            title={member.name?.trim() || member.userId}
            subtitle={emailByUserId.get(member.userId)}
            imageUrl={member.imageUrl}
            countryCode={member.countryCode}
          />
        ))}
      </div>
    </div>
  );
}

export function HorseHubPeople({ horse, className }: HorseHubPeopleProps) {
  const t = useTranslations("horseHub");
  const ownership = horse.sections.ownership;
  const coOwners = horse.sections.coOwnerManagement;
  const representatives = horse.sections.proactiveRepresentatives;

  if (!ownership && !coOwners && !representatives) return null;

  const emailByUserId = new Map<string, string>();
  for (const member of horse.adminTeam ?? []) {
    if (member.email?.trim()) {
      emailByUserId.set(member.userId, member.email.trim());
    }
  }

  const ownerMembers: HorseHubMemberSummary[] = ownership?.mainOwner
    ? [ownership.mainOwner]
    : [];
  const coOwnerMembers = coOwners?.members ?? [];
  const representativeMembers = representatives?.members ?? [];

  const groups = [
    { label: t("owner"), members: ownerMembers },
    { label: t("coOwners"), members: coOwnerMembers },
    { label: t("representatives"), members: representativeMembers },
  ].filter((group) => group.members.length > 0);

  const isEmpty = groups.length === 0;

  return (
    <Section title={t("people")} className={cn(className)}>
      {isEmpty ? (
        <p className="text-sm text-muted-foreground">{t("peopleEmpty")}</p>
      ) : (
        <div className="flex flex-col gap-3">
          {groups.map((group, index) => (
            <PeopleGroup
              key={group.label}
              label={group.label}
              members={group.members}
              emailByUserId={emailByUserId}
              showDivider={index > 0}
            />
          ))}
        </div>
      )}
    </Section>
  );
}
