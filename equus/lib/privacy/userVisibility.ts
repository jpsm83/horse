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

export type PublicUserIdentity = {
  id: string;
  email?: string;
  firstName?: string;
  lastName?: string;
  phone?: string;
  businessName?: string;
};

export type RequesterVisibilityContext = {
  isAuthenticated: boolean;
  hasRelationship: boolean;
  hasCollaboration: boolean;
  isSelf?: boolean;
};

const DEFAULT_PREFERENCES: PublicUserPreferences = {
  profileVisibility: "public",
  allowDirectMessagesFrom: "everyone",
};

function withDefaults(
  preferences?: Partial<PublicUserPreferences> | null,
): PublicUserPreferences {
  return {
    profileVisibility: preferences?.profileVisibility ?? DEFAULT_PREFERENCES.profileVisibility,
    allowDirectMessagesFrom:
      preferences?.allowDirectMessagesFrom ??
      DEFAULT_PREFERENCES.allowDirectMessagesFrom,
  };
}

export function resolveAudienceForRequester(
  context: RequesterVisibilityContext,
): UserVisibilityAudience {
  if (context.isSelf) {
    return "self";
  }
  if (context.hasRelationship) {
    return "relationship";
  }
  if (context.hasCollaboration) {
    return "collaboration";
  }
  return context.isAuthenticated ? "platform" : "public";
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

export function canStartDirectMessage(
  preferences: Partial<PublicUserPreferences> | null | undefined,
  audience: UserVisibilityAudience,
): boolean {
  if (audience === "self") return true;

  const resolved = withDefaults(preferences);
  switch (resolved.allowDirectMessagesFrom) {
    case "everyone":
      return audience !== "public";
    case "relationships":
      return audience === "relationship" || audience === "collaboration";
    case "nobody":
      return false;
    default:
      return false;
  }
}

export function toPublicUserIdentity(
  doc: Record<string, unknown> | null | undefined,
  audience: UserVisibilityAudience,
): PublicUserIdentity | undefined {
  if (!doc) return undefined;
  const personalDetails = (doc.personalDetails ?? {}) as Record<string, unknown>;
  const preferences = (doc.preferences ?? {}) as Partial<PublicUserPreferences>;
  const canExpose = canExposeUserIdentity(preferences, audience);
  const businessDetails = (doc.businessDetails ?? {}) as Record<string, unknown>;

  return {
    id: String(doc._id),
    email: canExpose ? (personalDetails.email as string | undefined) : undefined,
    firstName: canExpose ? (personalDetails.firstName as string | undefined) : undefined,
    lastName: canExpose ? (personalDetails.lastName as string | undefined) : undefined,
    phone: canExpose ? (personalDetails.phoneNumber as string | undefined) : undefined,
    businessName: canExpose ? (businessDetails.businessName as string | undefined) : undefined,
  };
}

