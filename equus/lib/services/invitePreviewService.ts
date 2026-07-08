/**
 * Public invite preview for signup landing pages (staff membership or relationship referral).
 */

import mongoose from "mongoose";
import WorkplaceRelationship from "../../models/WorkplaceRelationship.ts";
import Stable from "../../models/Stable.ts";
import Breeder from "../../models/Breeder.ts";
import RidingClub from "../../models/RidingClub.ts";
import Transport from "../../models/Transport.ts";
import { isStaffMembershipRef } from "@/lib/utils/inviteRef.ts";
import * as relationshipService from "./relationshipService.ts";
export type InviteRefPreview = {
  kind: "staff" | "relationship";
  profileName?: string;
  horseName?: string;
  relationshipType?: string;
  requesterLabel?: string;
};

const MODEL_BY_ROLE_TYPE = {
  stable: Stable,
  breeder: Breeder,
  ridingClub: RidingClub,
  transport: Transport,
} as const;

const NAME_FIELD_BY_ROLE_TYPE = {
  stable: "tradeName",
  breeder: "operationName",
  ridingClub: "clubName",
  transport: "companyName",
} as const;

async function getStaffInvitePreview(membershipId: string): Promise<InviteRefPreview | null> {
  if (!mongoose.Types.ObjectId.isValid(membershipId)) return null;

  const collaboration = await WorkplaceRelationship.findById(membershipId).lean();
  if (!collaboration || collaboration.status !== "invited") return null;

  const roleType = collaboration.hostRoleType as keyof typeof MODEL_BY_ROLE_TYPE;
  const Model = MODEL_BY_ROLE_TYPE[roleType];
  if (!Model) return null;

  const profile = await Model.findById(collaboration.hostRoleProfileId)
    .select(NAME_FIELD_BY_ROLE_TYPE[roleType])
    .lean();

  const nameField = NAME_FIELD_BY_ROLE_TYPE[roleType];
  const profileName = profile
    ? String((profile as Record<string, unknown>)[nameField] ?? "")
    : undefined;

  return {
    kind: "staff",
    profileName: profileName || undefined,
  };
}

export async function resolveInviteRefPreview(ref: string): Promise<InviteRefPreview | null> {
  const trimmed = ref.trim();
  if (!trimmed) return null;

  if (isStaffMembershipRef(trimmed)) {
    return getStaffInvitePreview(trimmed);
  }

  const relationshipPreview = await relationshipService.getInvitePreviewByReferral(trimmed);
  if (!relationshipPreview) return null;

  return {
    kind: "relationship",
    horseName: relationshipPreview.horseName,
    relationshipType: relationshipPreview.relationshipType,
    requesterLabel: relationshipPreview.requesterLabel,
  };
}
