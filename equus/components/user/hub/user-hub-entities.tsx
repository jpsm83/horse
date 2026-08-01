/**
 * UserHubEntities — read-only list of the user's owned horses for the shared
 * user hub. Consumes the server-filtered `entities` list projection.
 */

"use client";

import { useTranslations } from "next-intl";

import { EntityChip } from "@/components/shared/entity-chip.tsx";
import type { UserHubEntityItem } from "@/lib/users/userHubSections.ts";

type Props = {
  entities: UserHubEntityItem[];
};

export function UserHubEntities({ entities }: Props) {
  const t = useTranslations("userHub");

  if (entities.length === 0) {
    return <p className="text-sm text-muted-foreground">{t("noEntities")}</p>;
  }

  return (
    <ul className="flex flex-col gap-2">
      {entities.map((entity) => (
        <EntityChip
          key={entity.entityId}
          entityType="horse"
          entityId={entity.entityId}
          title={entity.name}
          imageUrl={entity.imageUrl}
        />
      ))}
    </ul>
  );
}
