/**
 * Collaboration capabilities — derived from hierarchyLevel on WorkplaceRelationship.
 *
 * Profile owner has all capabilities. Used by requireRoleProfileAccess and profile PATCH routes.
 */

import type { workplaceHierarchyLevelEnums } from "../../utils/enums.ts";

export type RoleProfileCapability =
  | "manage_role_profile"
  | "edit_role_profile"
  | "view_role_profile";

/** @deprecated Use manage_role_profile */
export type LegacyRoleProfileCapability = "manage_staff" | "edit_profile" | "view_profile";

type HierarchyLevel = (typeof workplaceHierarchyLevelEnums)[number];

const CAPABILITIES_BY_LEVEL: Record<HierarchyLevel, ReadonlySet<RoleProfileCapability>> = {
  admin: new Set(["manage_role_profile", "edit_role_profile", "view_role_profile"]),
  manager: new Set(["view_role_profile", "edit_role_profile"]),
  staff: new Set(["view_role_profile"]),
};

const LEGACY_CAPABILITY_MAP: Record<LegacyRoleProfileCapability, RoleProfileCapability> = {
  manage_staff: "manage_role_profile",
  edit_profile: "edit_role_profile",
  view_profile: "view_role_profile",
};

export function normalizeCapability(
  capability: RoleProfileCapability | LegacyRoleProfileCapability,
): RoleProfileCapability {
  if (capability in LEGACY_CAPABILITY_MAP) {
    return LEGACY_CAPABILITY_MAP[capability as LegacyRoleProfileCapability];
  }
  return capability as RoleProfileCapability;
}

/** Whether an active collaborator's hierarchy grants a capability. */
export function hasCollaboratorCapability(
  hierarchyLevel: HierarchyLevel,
  capability: RoleProfileCapability | LegacyRoleProfileCapability,
): boolean {
  return CAPABILITIES_BY_LEVEL[hierarchyLevel].has(normalizeCapability(capability));
}

/** @deprecated Use hasCollaboratorCapability */
export const hasStaffCapability = hasCollaboratorCapability;

/** Profile owners implicitly have all capabilities. */
export function ownerHasCapability(_capability: RoleProfileCapability): boolean {
  return true;
}
