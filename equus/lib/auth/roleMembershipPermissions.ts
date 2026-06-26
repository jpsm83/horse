/**
 * Role membership capabilities — derived from staffRole preset levels.
 *
 * Business rule: only profile owner or staff admin may edit_profile.
 * Used by `requireRoleProfileAccess` and future profile PATCH routes.
 */

import type { roleStaffLevelEnums } from "../../utils/enums.ts";

export type RoleProfileCapability = "manage_staff" | "edit_profile" | "view_profile";

type StaffRole = (typeof roleStaffLevelEnums)[number];

const CAPABILITIES_BY_STAFF_ROLE: Record<StaffRole, ReadonlySet<RoleProfileCapability>> = {
  admin: new Set(["manage_staff", "edit_profile", "view_profile"]),
  manager: new Set(["view_profile", "edit_profile"]),
  staff: new Set(["view_profile"]),
};

/** Whether an active staff member's preset role grants a capability. */
export function hasStaffCapability(
  staffRole: StaffRole,
  capability: RoleProfileCapability,
): boolean {
  return CAPABILITIES_BY_STAFF_ROLE[staffRole].has(capability);
}

/** Profile owners implicitly have all capabilities. */
export function ownerHasCapability(_capability: RoleProfileCapability): boolean {
  return true;
}
