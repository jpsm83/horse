/**
 * Role profile access checks — owner or active RoleMembership with required capability.
 *
 * Used by staff API routes and future business profile PATCH handlers.
 */

import { ApiError } from "../api/errors.ts";
import RoleMembership from "../../models/RoleMembership.ts";
import {
  findBusinessRoleProfile,
  type BusinessRoleType,
} from "../roleProfiles/businessRoleProfile.ts";
import {
  hasStaffCapability,
  ownerHasCapability,
  type RoleProfileCapability,
} from "./roleMembershipPermissions.ts";

/** Returns true when the user is owner or has an active membership with the capability. */
export async function canAccessRoleProfile(
  userId: string,
  roleType: BusinessRoleType,
  roleProfileId: string,
  requiredCapability: RoleProfileCapability,
): Promise<boolean> {
  const resolved = await findBusinessRoleProfile(roleType, roleProfileId);
  if (!resolved) {
    return false;
  }

  if (resolved.ownerUserId === userId) {
    return ownerHasCapability(requiredCapability);
  }

  const membership = await RoleMembership.findOne({
    roleType,
    roleProfileId,
    userId,
    status: "active",
  }).lean();

  if (!membership) {
    return false;
  }

  return hasStaffCapability(
    membership.staffRole as Parameters<typeof hasStaffCapability>[0],
    requiredCapability,
  );
}

/** Throws 404 when profile missing, 403 when capability denied. */
export async function requireRoleProfileAccess(
  userId: string,
  roleType: BusinessRoleType,
  roleProfileId: string,
  requiredCapability: RoleProfileCapability,
): Promise<void> {
  const resolved = await findBusinessRoleProfile(roleType, roleProfileId);
  if (!resolved) {
    throw new ApiError(404, "Role profile not found", "NOT_FOUND");
  }

  const allowed = await canAccessRoleProfile(
    userId,
    roleType,
    roleProfileId,
    requiredCapability,
  );

  if (!allowed) {
    throw new ApiError(403, "Insufficient permissions for this role profile", "FORBIDDEN");
  }
}
