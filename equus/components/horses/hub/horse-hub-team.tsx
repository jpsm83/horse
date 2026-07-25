"use client";

import { useTranslations } from "next-intl";

import type { HorseHubConnectionItem, HorseHubOwnershipSection } from "@/lib/services/horseService.ts";

type HorseHubTeamProps = {
  ownership?: HorseHubOwnershipSection;
  connections?: HorseHubConnectionItem[];
};

export function HorseHubTeam({ ownership, connections }: HorseHubTeamProps) {
  const t = useTranslations("horseHub");

  const hasOwnerInfo = ownership != null;
  const hasConnections = connections && connections.length > 0;

  if (!hasOwnerInfo && !hasConnections) {
    return <p className="text-sm text-muted-foreground">{t("teamEmpty")}</p>;
  }

  return (
    <div className="flex flex-col gap-4">
      {hasOwnerInfo && (
        <div>
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground mb-1">
            {t("ownership")}
          </p>
          <p className="text-sm text-foreground">
            {ownership!.soleOwner ? t("soleOwner") : t("coOwnersCount", { count: ownership!.coOwnerCount + 1 })}
          </p>
        </div>
      )}
      {hasConnections && (
        <div>
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground mb-2">
            {t("connections")}
          </p>
          <ul className="flex flex-col gap-2">
            {connections!.map((c) => (
              <li key={c.id} className="flex items-center justify-between gap-2 text-sm">
                <span className="font-medium">{c.displayName}</span>
                <span className="text-xs text-muted-foreground">{c.relationshipType}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
