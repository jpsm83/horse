/**
 * Barn collaborator horse access — may act on horses hosted by their stable.
 *
 * Requires active WorkplaceRelationship at the stable AND accepted horse↔stable Relationship.
 * Direct providers use horse Relationship only (see relationshipService).
 */

import mongoose from "mongoose";
import WorkplaceRelationship from "@/models/WorkplaceRelationship.ts";
import Relationship from "@/models/Relationship.ts";
import type { BusinessRoleType } from "@/lib/roleProfiles/businessRoleProfile.ts";

export async function canCollaboratorActOnHorse(
  userId: string,
  horseId: string,
  hostRoleType: BusinessRoleType,
  hostRoleProfileId: string,
): Promise<boolean> {
  if (
    !mongoose.Types.ObjectId.isValid(userId) ||
    !mongoose.Types.ObjectId.isValid(horseId) ||
    !mongoose.Types.ObjectId.isValid(hostRoleProfileId)
  ) {
    return false;
  }

  const collaboration = await WorkplaceRelationship.findOne({
    userId,
    hostRoleType,
    hostRoleProfileId,
    status: "active",
    active: true,
  }).lean();

  if (!collaboration) {
    return false;
  }

  const hosting = await Relationship.findOne({
    horseId,
    relationshipType: "stable",
    receiverAccountType: "stable",
    receiverAccountId: hostRoleProfileId,
    status: "accepted",
  }).lean();

  return Boolean(hosting);
}
