/**
 * Provider role profile resolver for horse Relationship invites.
 *
 * Maps relationshipType to entity-owned (Stable, …) or user-linked (Trainer, …) documents
 * and returns the operator user id plus display label for emails and snapshots.
 */

import mongoose from "mongoose";
import {
  findBusinessRoleProfile,
  type BusinessRoleType,
} from "../roleProfiles/businessRoleProfile.ts";
import Trainer from "../../models/Trainer.ts";
import Veterinary from "../../models/Veterinary.ts";
import Groom from "../../models/Groom.ts";
import Farrier from "../../models/Farrier.ts";
import Rider from "../../models/Rider.ts";
import Coach from "../../models/Coach.ts";
import { businessRoleTypeEnums } from "../../utils/enums.ts";

export type ResolvedProviderProfile = {
  accountType: string;
  profileId: string;
  operatorUserId: string;
  displayLabel: string;
  contactEmail?: string;
};

const NAME_FIELD_BY_BUSINESS_ROLE: Record<BusinessRoleType, string> = {
  stable: "tradeName",
  breeder: "operationName",
  ridingClub: "clubName",
  transport: "companyName",
};

const USER_LINKED_MODEL_BY_TYPE = {
  trainer: { Model: Trainer, labelField: "displayName" },
  veterinary: { Model: Veterinary, labelField: "practiceName" },
  groom: { Model: Groom, labelField: "displayName" },
  farrier: { Model: Farrier, labelField: "displayName" },
  rider: { Model: Rider, labelField: "displayName" },
  coach: { Model: Coach, labelField: "displayName" },
} as const;

type UserLinkedRelationshipType = keyof typeof USER_LINKED_MODEL_BY_TYPE;

function isBusinessRoleType(value: string): value is BusinessRoleType {
  return (businessRoleTypeEnums as readonly string[]).includes(value);
}

function isUserLinkedRelationshipType(value: string): value is UserLinkedRelationshipType {
  return value in USER_LINKED_MODEL_BY_TYPE;
}

/** Load a provider profile by relationship type and profile id. */
export async function resolveProviderProfile(
  relationshipType: string,
  profileId: string,
): Promise<ResolvedProviderProfile | null> {
  if (!mongoose.Types.ObjectId.isValid(profileId)) {
    return null;
  }

  if (isBusinessRoleType(relationshipType)) {
    const result = await findBusinessRoleProfile(relationshipType, profileId);
    if (!result) return null;

    const nameField = NAME_FIELD_BY_BUSINESS_ROLE[relationshipType];
    const displayLabel = String(result.profile[nameField] ?? "").trim();

    return {
      accountType: relationshipType,
      profileId,
      operatorUserId: result.mainOwnerUserId,
      displayLabel,
    };
  }

  if (!isUserLinkedRelationshipType(relationshipType)) {
    return null;
  }

  const config = USER_LINKED_MODEL_BY_TYPE[relationshipType];
  const profile = await config.Model.findById(profileId).lean();
  if (!profile) return null;

  const profileRecord = profile as Record<string, unknown>;
  const operatorUserId = profileRecord.userId;
  if (operatorUserId == null) return null;

  return {
    accountType: relationshipType,
    profileId,
    operatorUserId: String(operatorUserId),
    displayLabel: String(profileRecord[config.labelField] ?? "").trim(),
    contactEmail: (profileRecord.email as string | undefined)?.toLowerCase().trim(),
  };
}

/** User-linked profile id field on User for accept-time backfill. */
export const USER_LINKED_PROFILE_FIELD_BY_TYPE: Record<UserLinkedRelationshipType, string> = {
  trainer: "trainerProfileId",
  veterinary: "veterinaryProfileId",
  groom: "groomProfileId",
  farrier: "farrierProfileId",
  rider: "riderProfileId",
  coach: "coachProfileId",
};

export function isUserLinkedRelationshipTypeForBackfill(
  relationshipType: string,
): relationshipType is UserLinkedRelationshipType {
  return isUserLinkedRelationshipType(relationshipType);
}
