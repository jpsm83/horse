/**
 * Horse hub — grouped provider invitation sections (one picker per relationship type).
 */

"use client";

import { useTranslations } from "next-intl";

import { ProviderInvitePicker } from "@/components/invites/provider-invite-picker.tsx";
import type { PublicRelationship } from "@/lib/services/relationshipService";
import type { DiscoverProviderType } from "@/lib/api/discoverClient.ts";

const HORSE_PROVIDER_GROUPS: Array<{
  groupKey: "hosting" | "care" | "training";
  types: DiscoverProviderType[];
}> = [
  {
    groupKey: "hosting",
    types: ["stable", "transport", "ridingClub", "breeder"],
  },
  {
    groupKey: "care",
    types: ["veterinary", "groom", "farrier"],
  },
  {
    groupKey: "training",
    types: ["trainer", "coach", "rider"],
  },
];

export type HorseProviderInvitesProps = {
  horseId: string;
  pendingRelationships: PublicRelationship[];
};

function isPendingForType(
  pendingRelationships: PublicRelationship[],
  horseId: string,
  relationshipType: string,
): boolean {
  return pendingRelationships.some(
    (relationship) =>
      relationship.horseId === horseId &&
      relationship.relationshipType === relationshipType &&
      relationship.status === "pending",
  );
}

export function HorseProviderInvites({
  horseId,
  pendingRelationships,
}: HorseProviderInvitesProps) {
  const t = useTranslations("invites.horseProviders");

  return (
    <div className="space-y-8">
      {HORSE_PROVIDER_GROUPS.map((group) => (
        <section key={group.groupKey} className="space-y-4">
          <div>
            <h3 className="text-lg font-medium">{t(`groups.${group.groupKey}.title`)}</h3>
            <p className="text-sm text-muted-foreground">
              {t(`groups.${group.groupKey}.description`)}
            </p>
          </div>

          <ul className="space-y-4">
            {group.types.map((relationshipType) => (
              <li key={relationshipType} className="rounded-lg border p-4">
                <div className="mb-3 space-y-1">
                  <p className="font-medium">{t(`types.${relationshipType}`)}</p>
                  <p className="text-sm text-muted-foreground">
                    {t(`types.${relationshipType}Hint`)}
                  </p>
                </div>
                <ProviderInvitePicker
                  inviteContext="horse"
                  targetId={horseId}
                  relationshipType={relationshipType}
                  isPending={isPendingForType(pendingRelationships, horseId, relationshipType)}
                />
              </li>
            ))}
          </ul>
        </section>
      ))}
    </div>
  );
}
