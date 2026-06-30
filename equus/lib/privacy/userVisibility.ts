/**
 * User visibility policy helpers.
 *
 * Centralizes profile exposure rules so API mappers can consistently decide which
 * personal fields are returned to each audience/context.
 */

import type { PublicUserPreferences } from "@/lib/services/userService.ts";

export type UserVisibilityAudience =
  | "self"
  | "public"
  | "platform"
  | "relationship"
  | "collaboration";

const DEFAULT_PREFERENCES: PublicUserPreferences = {
  profileVisibility: "public",
  searchable: true,
  allowDirectMessagesFrom: "everyone",
};

function withDefaults(
  preferences?: Partial<PublicUserPreferences> | null,
): PublicUserPreferences {
  return {
    profileVisibility: preferences?.profileVisibility ?? DEFAULT_PREFERENCES.profileVisibility,
    searchable: preferences?.searchable ?? DEFAULT_PREFERENCES.searchable,
    allowDirectMessagesFrom:
      preferences?.allowDirectMessagesFrom ??
      DEFAULT_PREFERENCES.allowDirectMessagesFrom,
  };
}

export function canExposeUserIdentity(
  preferences: Partial<PublicUserPreferences> | null | undefined,
  audience: UserVisibilityAudience,
): boolean {
  if (audience === "self") {
    return true;
  }

  const resolved = withDefaults(preferences);

  switch (resolved.profileVisibility) {
    case "public":
      return true;
    case "platform":
      return audience !== "public";
    case "relationships":
      return audience === "relationship" || audience === "collaboration";
    case "private":
      // Operational contexts may still require identity to complete workflows.
      return audience === "relationship" || audience === "collaboration";
    default:
      return true;
  }
}

