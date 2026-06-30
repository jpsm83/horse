/**
 * Business role profile resolver — loads Stable, Breeder, RidingClub, or Transport by type.
 *
 * Used by `requireRoleProfileAccess` and `workplaceRelationshipService`.
 */

import mongoose from "mongoose";
import { ApiError } from "../api/errors.ts";
import { resolveMainOwnerUserId, userHasOwnerAccess } from "../ownership/entityOwnership.ts";
import Stable from "../../models/Stable.ts";
import Breeder from "../../models/Breeder.ts";
import RidingClub from "../../models/RidingClub.ts";
import Transport from "../../models/Transport.ts";
import { businessRoleTypeEnums } from "../../utils/enums.ts";

export type BusinessRoleType = (typeof businessRoleTypeEnums)[number];

const MODEL_BY_ROLE_TYPE = {
  stable: Stable,
  breeder: Breeder,
  ridingClub: RidingClub,
  transport: Transport,
} as const;

export type BusinessRoleProfileResult = {
  roleType: BusinessRoleType;
  roleProfileId: string;
  /** Primary operator on the profile (mainOwnerUserId or breeder userId). */
  mainOwnerUserId: string;
  /** @deprecated Use mainOwnerUserId */
  ownerUserId: string;
  profile: Record<string, unknown>;
};

/** Validate a URL path segment as a business role type. */
export function parseBusinessRoleType(param: string): BusinessRoleType {
  if ((businessRoleTypeEnums as readonly string[]).includes(param)) {
    return param as BusinessRoleType;
  }
  throw new ApiError(400, "Invalid business role type", "VALIDATION_ERROR");
}

/** Load a business role profile document and return main operator user id. */
export async function findBusinessRoleProfile(
  roleType: BusinessRoleType,
  roleProfileId: string,
): Promise<BusinessRoleProfileResult | null> {
  if (!mongoose.Types.ObjectId.isValid(roleProfileId)) {
    return null;
  }

  const Model = MODEL_BY_ROLE_TYPE[roleType];
  const profile = await Model.findById(roleProfileId).lean();

  if (!profile) {
    return null;
  }

  const profileRecord = profile as Record<string, unknown>;
  const mainOwnerUserId = resolveMainOwnerUserId(roleType, profileRecord);
  if (!mainOwnerUserId) {
    return null;
  }

  return {
    roleType,
    roleProfileId,
    mainOwnerUserId,
    ownerUserId: mainOwnerUserId,
    profile: profileRecord,
  };
}

export { userHasOwnerAccess };
