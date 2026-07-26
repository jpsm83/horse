/**
 * Hub path helpers for EntityChip and other cross-entity identity links.
 * Extend when stable / groom / etc. hubs exist.
 */

import { userHubPath } from "@/lib/navigation/userTabs.ts";

export type EntityChipEntityType = "user" | "horse";

/**
 * Returns the hub URL for an entity, or null when the type has no route yet
 * or the id is missing.
 */
export function entityHubPath(
  entityType: EntityChipEntityType,
  entityId: string | undefined,
): string | null {
  if (!entityId) return null;

  switch (entityType) {
    case "user":
      return userHubPath(entityId);
    case "horse":
      return `/horses/${entityId}`;
    default:
      return null;
  }
}
