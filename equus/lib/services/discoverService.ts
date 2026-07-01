/**
 * Discover service — searchable provider profiles for invitation pickers.
 *
 * Called by GET /api/v1/discover/providers. Horse scope: all provider types.
 * Host scope: service types only (future workplace staff picker).
 */

import mongoose from "mongoose";
import Stable from "@/models/Stable.ts";
import Breeder from "@/models/Breeder.ts";
import RidingClub from "@/models/RidingClub.ts";
import Transport from "@/models/Transport.ts";
import Trainer from "@/models/Trainer.ts";
import Veterinary from "@/models/Veterinary.ts";
import Groom from "@/models/Groom.ts";
import Farrier from "@/models/Farrier.ts";
import Coach from "@/models/Coach.ts";
import Rider from "@/models/Rider.ts";
import Relationship from "@/models/Relationship.ts";
import { ApiError } from "@/lib/api/errors.ts";
import {
  filterActiveOperatorUserIds,
  mergeActiveOnly,
} from "@/lib/lifecycle/activeQuery.ts";
import {
  assertTypeAllowedForScope,
  type DiscoverProvidersQuery,
} from "@/lib/validations/discover.ts";
import { canViewStableDiscovery } from "@/lib/stables/stableDiscoveryAccess.ts";
import { canViewBreederDiscovery } from "@/lib/breeders/breederDiscoveryAccess.ts";
import { canViewTransportDiscovery } from "@/lib/transports/transportDiscoveryAccess.ts";
import { canViewRidingClubDiscovery } from "@/lib/ridingClubs/ridingClubDiscoveryAccess.ts";
import { canViewTrainerDiscovery } from "@/lib/trainers/trainerDiscoveryAccess.ts";
import { canViewVeterinaryDiscovery } from "@/lib/veterinaries/veterinaryDiscoveryAccess.ts";
import { canViewGroomDiscovery } from "@/lib/grooms/groomDiscoveryAccess.ts";
import { canViewFarrierDiscovery } from "@/lib/farriers/farrierDiscoveryAccess.ts";
import { canViewCoachDiscovery } from "@/lib/coaches/coachDiscoveryAccess.ts";
import { canViewRiderDiscovery } from "@/lib/riders/riderDiscoveryAccess.ts";
import type { relationshipTypeEnums } from "@/utils/enums.ts";

export type DiscoverProviderCard = {
  id: string;
  label: string;
  subtitle?: string;
  imageUrl?: string;
};

type ProviderType = (typeof relationshipTypeEnums)[number];

type ProviderSearchConfig = {
  Model: mongoose.Model<unknown>;
  labelField: string;
  imageField?: string;
  operatorField: "mainOwnerUserId" | "userId";
  canView: (profile: Record<string, unknown>, context: Record<string, unknown>) => boolean;
  relationshipContextKey: string;
};

const PROVIDER_CONFIG: Record<ProviderType, ProviderSearchConfig> = {
  stable: {
    Model: Stable,
    labelField: "tradeName",
    imageField: "imageUrl",
    operatorField: "mainOwnerUserId",
    canView: canViewStableDiscovery,
    relationshipContextKey: "hasAcceptedHorseStableRelationship",
  },
  breeder: {
    Model: Breeder,
    labelField: "operationName",
    imageField: "imageUrl",
    operatorField: "mainOwnerUserId",
    canView: canViewBreederDiscovery,
    relationshipContextKey: "hasAcceptedHorseBreederRelationship",
  },
  ridingClub: {
    Model: RidingClub,
    labelField: "clubName",
    imageField: "imageUrl",
    operatorField: "mainOwnerUserId",
    canView: canViewRidingClubDiscovery,
    relationshipContextKey: "hasAcceptedHorseRidingClubRelationship",
  },
  transport: {
    Model: Transport,
    labelField: "companyName",
    imageField: "imageUrl",
    operatorField: "mainOwnerUserId",
    canView: canViewTransportDiscovery,
    relationshipContextKey: "hasAcceptedHorseTransportRelationship",
  },
  trainer: {
    Model: Trainer,
    labelField: "displayName",
    imageField: "imageUrl",
    operatorField: "userId",
    canView: canViewTrainerDiscovery,
    relationshipContextKey: "hasAcceptedHorseTrainerRelationship",
  },
  veterinary: {
    Model: Veterinary,
    labelField: "practiceName",
    imageField: "imageUrl",
    operatorField: "userId",
    canView: canViewVeterinaryDiscovery,
    relationshipContextKey: "hasAcceptedHorseVeterinaryRelationship",
  },
  groom: {
    Model: Groom,
    labelField: "displayName",
    imageField: "imageUrl",
    operatorField: "userId",
    canView: canViewGroomDiscovery,
    relationshipContextKey: "hasAcceptedHorseGroomRelationship",
  },
  farrier: {
    Model: Farrier,
    labelField: "displayName",
    imageField: "imageUrl",
    operatorField: "userId",
    canView: canViewFarrierDiscovery,
    relationshipContextKey: "hasAcceptedHorseFarrierRelationship",
  },
  coach: {
    Model: Coach,
    labelField: "displayName",
    imageField: "imageUrl",
    operatorField: "userId",
    canView: canViewCoachDiscovery,
    relationshipContextKey: "hasAcceptedHorseCoachRelationship",
  },
  rider: {
    Model: Rider,
    labelField: "displayName",
    imageField: "imageUrl",
    operatorField: "userId",
    canView: canViewRiderDiscovery,
    relationshipContextKey: "hasAcceptedHorseRiderRelationship",
  },
};

function escapeRegex(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

async function getAcceptedProfileIds(
  requesterUserId: string,
  relationshipType: ProviderType,
): Promise<Set<string>> {
  const docs = await Relationship.find({
    status: "accepted",
    relationshipType,
    receiverAccountType: relationshipType,
    $or: [
      { requesterUserId: new mongoose.Types.ObjectId(requesterUserId) },
      { receiverUserId: new mongoose.Types.ObjectId(requesterUserId) },
    ],
  })
    .select("receiverAccountId")
    .lean();

  return new Set(
    docs
      .map((doc) => (doc.receiverAccountId ? String(doc.receiverAccountId) : ""))
      .filter(Boolean),
  );
}

function getOperatorUserId(
  profile: Record<string, unknown>,
  operatorField: ProviderSearchConfig["operatorField"],
): string | undefined {
  const value = profile[operatorField];
  return value != null ? String(value) : undefined;
}

export async function searchDiscoverProviders(
  requesterUserId: string,
  query: DiscoverProvidersQuery,
): Promise<DiscoverProviderCard[]> {
  try {
    assertTypeAllowedForScope(query.type, query.scope);
  } catch {
    throw new ApiError(
      400,
      "Provider type not allowed for this discover scope",
      "VALIDATION_ERROR",
    );
  }

  const config = PROVIDER_CONFIG[query.type];
  const limit = query.limit ?? 20;
  const trimmedQuery = query.q?.trim();

  const mongoFilter: Record<string, unknown> = {};
  if (trimmedQuery) {
    const pattern = new RegExp(escapeRegex(trimmedQuery), "i");
    mongoFilter.$or = [{ [config.labelField]: pattern }, { "address.city": pattern }];
  }

  const candidates = await config.Model.find(mergeActiveOnly(mongoFilter))
    .sort({ [config.labelField]: 1 })
    .limit(Math.min(limit * 3, 60))
    .lean();

  const acceptedProfileIds = await getAcceptedProfileIds(requesterUserId, query.type);
  const activeOperatorIds = await filterActiveOperatorUserIds(
    candidates
      .map((doc) =>
        getOperatorUserId(doc as Record<string, unknown>, config.operatorField),
      )
      .filter((id): id is string => Boolean(id)),
  );
  const results: DiscoverProviderCard[] = [];

  for (const doc of candidates) {
    if (results.length >= limit) break;

    const profile = doc as Record<string, unknown>;
    const profileId = String(profile._id);
    const operatorUserId = getOperatorUserId(profile, config.operatorField);

    if (!operatorUserId || !activeOperatorIds.has(operatorUserId)) {
      continue;
    }

    if (operatorUserId === requesterUserId) {
      continue;
    }

    const visibilityContext: Record<string, unknown> = {
      requesterUserId,
      [config.relationshipContextKey]: acceptedProfileIds.has(profileId),
      hasActiveCollaboration: false,
    };

    if (!config.canView(profile, visibilityContext)) {
      continue;
    }

    const label = String(profile[config.labelField] ?? "").trim();
    if (!label) continue;

    const city = (profile.address as { city?: string } | undefined)?.city?.trim();
    const imageUrl = config.imageField
      ? (profile[config.imageField] as string | undefined)
      : undefined;

    results.push({
      id: profileId,
      label,
      subtitle: city || undefined,
      imageUrl: imageUrl || undefined,
    });
  }

  return results;
}
