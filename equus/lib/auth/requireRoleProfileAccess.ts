/**
 * Role profile access checks — owner or active WorkplaceRelationship with required capability.
 *
 * Used by collaboration API routes and future business profile PATCH handlers.
 */

import { ApiError } from "../api/errors.ts";
import WorkplaceRelationship from "../../models/WorkplaceRelationship.ts";
import {
  findBusinessRoleProfile,
  type BusinessRoleType,
} from "../roleProfiles/businessRoleProfile.ts";
import {
  hasCollaboratorCapability,
  normalizeCapability,
  ownerHasCapability,
  type RoleProfileCapability,
  type LegacyRoleProfileCapability,
} from "./workplaceRelationshipPermissions.ts";

/** Returns true when the user is owner or has an active collaboration with the capability. */
export async function canAccessRoleProfile(
  userId: string,
  roleType: BusinessRoleType,
  roleProfileId: string,
  requiredCapability: RoleProfileCapability | LegacyRoleProfileCapability,
): Promise<boolean> {
  const resolved = await findBusinessRoleProfile(roleType, roleProfileId);
  if (!resolved) {
    return false;
  }

  if (resolved.ownerUserId === userId) {
    return ownerHasCapability(normalizeCapability(requiredCapability));
  }

  const collaboration = await WorkplaceRelationship.findOne({
    hostRoleType: roleType,
    hostRoleProfileId: roleProfileId,
    userId,
    status: "active",
    active: true,
  }).lean();

  if (!collaboration) {
    return false;
  }

  return hasCollaboratorCapability(
    collaboration.hierarchyLevel as Parameters<typeof hasCollaboratorCapability>[0],
    requiredCapability,
  );
}

/** Throws 404 when profile missing, 403 when capability denied. */
export async function requireRoleProfileAccess(
  userId: string,
  roleType: BusinessRoleType,
  roleProfileId: string,
  requiredCapability: RoleProfileCapability | LegacyRoleProfileCapability,
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
