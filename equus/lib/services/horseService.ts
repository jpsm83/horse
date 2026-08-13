/**
 * Horse service — creation and discovery/public-read flows.
 *
 * Called by `/api/v1/horses` routes. Route handlers stay thin; ownership, visibility,
 * and contact resolution rules live here.
 */

import mongoose from "mongoose";
import Horse from "@/models/Horse.ts";
import User from "@/models/User.ts";
import { ApiError } from "@/lib/api/errors.ts";
import { guardHorseCreation } from "@/lib/billing/subscriptionGuard.ts";
import { ownedByUserQuery, userOwnsEntity } from "@/lib/ownership/entityOwnership.ts";
import {
  assertCanViewHorseGlobal,
  canAccessByItemVisibilityMode,
  canViewHorseHubSection,
  resolveHorseViewerAudience,
  type HorseViewerAudience,
} from "@/lib/horses/horseVisibilityAccess.ts";
import {
  normalizeHubSections,
  type HubSections,
} from "@/lib/horses/hubSections.ts";
import { assertPublicReadAllowed } from "@/lib/lifecycle/activeQuery.ts";
import type { z } from "zod";
import type {
  createHorseSchema,
  updateHorseDiscoverySchema,
  updateHorseHubSectionsSchema,
  updateHorseProfileSchema,
} from "@/lib/validations/horse.ts";
import {
  hasAtLeastOneHorseIdentity,
  HORSE_IDENTITY_REQUIRED_MESSAGE,
  normalizeHorseIdentityFields,
} from "@/lib/utils/horseIdentity.ts";
import { horseHubSectionKeys } from "@/utils/enums.ts";
import Media from "@/models/Media.ts";
import HorseEvent from "@/models/HorseEvent.ts";
import Relationship from "@/models/Relationship.ts";

export type CreateHorseInput = z.infer<typeof createHorseSchema>;
export type UpdateHorseDiscoveryInput = z.infer<typeof updateHorseDiscoverySchema>;
export type UpdateHorseHubSectionsInput = z.infer<typeof updateHorseHubSectionsSchema>;

// --- Role-aware view types ---

export type HorseTab =
  | "hub"
  | "connect"
  | "planning"
  | "media"
  | "documents"
  | "profile"
  | "admin"
  | "history";

export type ViewerRole =
  | "main_owner"
  | "co_owner"
  | "responsible"
  | "related"
  | "public"
  | "guest";

// --- List types ---

export type HorseListItem = {
  id: string;
  name?: string;
  breed?: string;
  sex?: string;
  color?: string;
  disciplines?: string[];
  profileImageUrl?: string;
  profileVisibility?: string;
  updatedAt?: string;
};

export type HorseListResult = {
  horses: HorseListItem[];
  total: number;
  page: number;
  limit: number;
};

export type HorseListFilters = {
  mine?: boolean;
  forSale?: boolean;
  breed?: string;
  sex?: string;
  countryOfBirth?: string;
  ageMin?: number;
  ageMax?: number;
  valueMin?: number;
  valueMax?: number;
  page?: number;
  limit?: number;
};

export type OwnerHorseCoOwner = {
  userId: string;
  label: string;
  ownershipPercentage: number;
  email?: string;
  phone?: string;
  imageUrl?: string;
  /** ISO alpha-2 from personalDetails.nationality. */
  countryCode?: string;
  joinedAt?: string;
};

export type OwnerHorseResponsible = {
  userId: string;
  label: string;
  email?: string;
  phone?: string;
  imageUrl?: string;
  /** ISO alpha-2 from personalDetails.nationality. */
  countryCode?: string;
  joinedAt?: string;
};

export type AdminTeamMember = {
  userId: string;
  type: "owner" | "co_owner" | "responsible";
  name: string;
  email: string;
  phone?: string;
  imageUrl?: string;
  /** ISO alpha-2 from personalDetails.nationality. */
  countryCode?: string;
  joinedAt: string;
};

export type OwnerHorseHubSummary = {
  id: string;
  name?: string;
  breed?: string;
  sex?: string;
  registeredName?: string;
  registryId?: string;
  microchipId?: string;
  passportNumber?: string;
  dateOfBirth?: string;
  color?: string;
  heightHands?: number;
  disciplines?: string[];
  countryOfBirth?: string;
  estimatedValue?: number;
  valueCurrency?: string;
  saleStatus?: string;
  askingPrice?: number;
  acquisitionDate?: string;
  acquisitionSourceUserId?: string;
  /** Resolved acquisition source (falls back to current owner when unset). */
  acquisitionSourceUser?: {
    userId: string;
    name: string;
    email: string;
    imageUrl?: string;
    countryCode?: string;
  };
  pedigree?: Record<string, unknown>;
  profileImageUrl?: string;
  description?: string;
  notes?: string;
  profileVisibility?: string;
  hubSections: Required<HubSections>;
  isMainOwner: boolean;
  isCoOwner: boolean;
  isResponsible: boolean;
  isAdmin: boolean;
  coOwners: OwnerHorseCoOwner[];
  responsibles: OwnerHorseResponsible[];
  adminTeam: AdminTeamMember[];
};

export type HorseHubIdentitySection = {
  age?: number;
  color?: string;
  heightHands?: number;
  disciplines?: string[];
  registeredName?: string;
  dateOfBirth?: string;
  countryOfBirth?: string;
};

export type HorseHubIdentificationSection = {
  registryId?: string;
  microchipId?: string;
  passportNumber?: string;
};

export type HorseHubPedigreeSection = {
  sireName?: string;
  damName?: string;
  bloodlineNotes?: string;
  sireHorseId?: string;
  damHorseId?: string;
  /** Hub-safe linked parent summary (no email) when the linked horse resolves. */
  sireSummary?: HorseHubPedigreeParentSummary;
  damSummary?: HorseHubPedigreeParentSummary;
};

/** Hub-safe pedigree parent projection — avoids per-parent client fetches. */
export type HorseHubPedigreeParentSummary = {
  horseId: string;
  name?: string;
  imageUrl?: string;
  /** ISO alpha-2 country of birth. */
  countryCode?: string;
};

export type HorseHubAboutSection = {
  description?: string;
};

export type HorseHubMemberSummary = {
  userId: string;
  name?: string;
  imageUrl?: string;
  /** ISO alpha-2 from personalDetails.nationality (hub-safe). */
  countryCode?: string;
};

export type HorseHubOwnershipSection = {
  coOwnerCount: number;
  soleOwner: boolean;
  /** Hub-safe main owner summary (no email/phone). */
  mainOwner?: HorseHubMemberSummary;
};

export type HorseHubValueSection = {
  saleStatus?: string;
  askingPrice?: number;
  estimatedValue?: number;
  valueCurrency?: string;
  acquisitionDate?: string; // ISO date string
  /** Resolved acquisition source (falls back to current owner when unset). */
  acquisitionSourceUser?: HorseHubMemberSummary;
};

export type HorseHubProactiveRepresentativesSection = {
  members: HorseHubMemberSummary[];
};

export type HorseHubCoOwnerManagementSection = {
  members: HorseHubMemberSummary[];
};

export type HorseHubGalleryItem = {
  id: string;
  type: string;
  url: string;
  thumbnailUrl?: string;
  title?: string;
};

export type HorseHubPlanningItem = {
  id: string;
  title: string;
  eventType: string;
  startDate: string;
  endDate?: string;
  location?: string;
};

export type HorseHubConnectionItem = {
  id: string;
  relationshipType: string;
  displayName: string;
};

export type HorseHubDto = {
  id: string;
  name?: string;
  breed?: string;
  sex?: string;
  profileImageUrl?: string;
  heroImageUrl?: string;
  sections: {
    identity?: HorseHubIdentitySection;
    identification?: HorseHubIdentificationSection;
    pedigree?: HorseHubPedigreeSection;
    about?: HorseHubAboutSection;
    ownership?: HorseHubOwnershipSection;
    value?: HorseHubValueSection;
    proactiveRepresentatives?: HorseHubProactiveRepresentativesSection;
    coOwnerManagement?: HorseHubCoOwnerManagementSection;
    gallery?: HorseHubGalleryItem[];
    planning?: HorseHubPlanningItem[];
    connections?: HorseHubConnectionItem[];
  };
};

/**
 * Unified role-scoped horse view DTO (shared chrome for all horse tabs).
 * Owner-only fields are populated when the viewer is on the ownership team.
 * `sections` holds cheap Hub projections (identity, identification, pedigree,
 * about, ownership, value, proactiveRepresentatives, coOwnerManagement)
 * filtered by L1+L2. Gallery / planning / connections lists are NOT populated
 * here — use `getHorseHubSocial` / GET …/hub-social.
 */
export type HorseViewDto = {
  id: string;
  name?: string;
  breed?: string;
  sex?: string;
  profileImageUrl?: string;
  /** Hub cover / hero band (guest-visible with profileImageUrl). */
  heroImageUrl?: string;
  profileVisibility?: string;

  /** Cheap Hub section projections only — no gallery/planning/connections lists. */
  sections: HorseHubDto["sections"];

  // Owner-team-only fields
  registeredName?: string;
  registryId?: string;
  microchipId?: string;
  passportNumber?: string;
  dateOfBirth?: string;
  color?: string;
  heightHands?: number;
  disciplines?: string[];
  countryOfBirth?: string;
  estimatedValue?: number;
  valueCurrency?: string;
  saleStatus?: string;
  askingPrice?: number;
  acquisitionDate?: string;
  acquisitionSourceUserId?: string;
  /** Resolved acquisition source (falls back to current owner when unset). */
  acquisitionSourceUser?: {
    userId: string;
    name: string;
    email: string;
    imageUrl?: string;
    countryCode?: string;
  };
  pedigree?: Record<string, unknown>;
  description?: string;
  notes?: string;
  hubSections?: Required<HubSections>;
  isMainOwner?: boolean;
  isCoOwner?: boolean;
  isResponsible?: boolean;
  isAdmin?: boolean;
  coOwners?: OwnerHorseCoOwner[];
  responsibles?: OwnerHorseResponsible[];
  adminTeam?: AdminTeamMember[];
};

export type HorseHubSocialSections = {
  gallery?: HorseHubGalleryItem[];
  planning?: HorseHubPlanningItem[];
  connections?: HorseHubConnectionItem[];
};

/** Guest-safe Hub social lists (Media / events / connections). */
export type HorseHubSocialResponse = {
  sections: HorseHubSocialSections;
};

/** Backward-compat alias for tab clients that previously used OwnerHorseSummary from horseClient. */
export type OwnerHorseSummary = HorseViewDto;

export type HorseViewResponse = {
  viewerRole: ViewerRole;
  allowedTabs: HorseTab[];
  horse: HorseViewDto;
};

function ensureObjectId(id: string, fieldName: string): void {
  if (!mongoose.Types.ObjectId.isValid(id)) {
    throw new ApiError(400, `Invalid ${fieldName}`, "VALIDATION_ERROR");
  }
}

export async function createHorse(actorUserId: string, input: CreateHorseInput) {
  ensureObjectId(actorUserId, "user id");

  // Subscription guard
  const guard = await guardHorseCreation(actorUserId);
  if (!guard.ok) {
    throw new ApiError(
      403,
      `Horse limit reached (${guard.current}/${guard.limit}). Upgrade to ${guard.requiredTier} to add more horses.`,
      guard.code,
    );
  }

  const doc: Record<string, unknown> = {
    name: input.name,
    breed: input.breed,
    sex: input.sex,
    mainOwnerUserId: actorUserId,
    createdByUserId: actorUserId,
    registration: {
      payerUserId: actorUserId,
    },
  };

  // Identity
  if (input.registeredName) doc.registeredName = input.registeredName;
  const identity = normalizeHorseIdentityFields(input);
  if (identity.registryId) doc.registryId = identity.registryId;
  if (identity.microchipId) doc.microchipId = identity.microchipId;
  if (identity.passportNumber) doc.passportNumber = identity.passportNumber;
  if (input.dateOfBirth) doc.dateOfBirth = input.dateOfBirth;
  if (input.color) doc.color = input.color;
  if (input.heightHands !== undefined) doc.heightHands = input.heightHands;
  if (input.disciplines && input.disciplines.length > 0) doc.disciplines = input.disciplines;
  if (input.countryOfBirth) doc.countryOfBirth = input.countryOfBirth;
  // Commercial
  if (input.estimatedValue !== undefined) doc.estimatedValue = input.estimatedValue;
  if (input.valueCurrency) doc.valueCurrency = input.valueCurrency;
  if (input.saleStatus) doc.saleStatus = input.saleStatus;
  if (input.askingPrice !== undefined) doc.askingPrice = input.askingPrice;
  if (input.acquisitionDate) doc.acquisitionDate = input.acquisitionDate;
  // Acquisition source is read-only: the creating owner is the initial source.
  doc.acquisitionSourceUserId = actorUserId;

  // Pedigree
  if (input.pedigree) {
    const pedigree: Record<string, unknown> = {};
    if (input.pedigree.sireName) pedigree.sireName = input.pedigree.sireName;
    if (input.pedigree.damName) pedigree.damName = input.pedigree.damName;
    if (input.pedigree.bloodlineNotes) pedigree.bloodlineNotes = input.pedigree.bloodlineNotes;
    doc.pedigree = pedigree;
  }

  // Media
  if (input.profileImageUrl) doc.profileImageUrl = input.profileImageUrl;
  if (input.gallery && input.gallery.length > 0) {
    doc.gallery = input.gallery.map((url: string) => ({
      url,
      type: url.match(/\.(mp4|webm|mov|avi|mkv)$/i) ? "video" : "image",
    }));
  }
  if (input.description) doc.description = input.description;

  // Discovery
  if (input.profileVisibility) doc.profileVisibility = input.profileVisibility;

  const horse = await Horse.create(doc);
  return horse.toObject();
}

// --- List ---

function toHorseListItem(doc: Record<string, unknown>): HorseListItem {
  return {
    id: String(doc._id),
    name: doc.name as string | undefined,
    breed: doc.breed as string | undefined,
    sex: doc.sex as string | undefined,
    color: doc.color as string | undefined,
    disciplines: doc.disciplines as string[] | undefined,
    profileImageUrl: doc.profileImageUrl as string | undefined,
    profileVisibility: doc.profileVisibility as string | undefined,
    updatedAt: (doc.updatedAt as Date | undefined)?.toISOString(),
  };
}

export async function listHorses(
  actorUserId: string | undefined,
  filters: HorseListFilters,
): Promise<HorseListResult> {
  const page = Math.max(1, filters.page ?? 1);
  const limit = Math.min(100, Math.max(1, filters.limit ?? 20));
  const skip = (page - 1) * limit;

  let query: Record<string, unknown> = {};

  if (filters.mine && actorUserId) {
    query = { ...ownedByUserQuery(actorUserId) };
  } else {
    query.profileVisibility = "public";
    query.isActive = { $ne: false };
  }

  if (filters.forSale) {
    query.saleStatus = "for_sale";
  }

  // Apply optional filters
  if (filters.breed) {
    query.breed = filters.breed;
  }
  if (filters.sex) {
    query.sex = filters.sex;
  }
  if (filters.countryOfBirth) {
    query.countryOfBirth = { $regex: filters.countryOfBirth, $options: "i" };
  }
  if (filters.ageMin !== undefined || filters.ageMax !== undefined) {
    const now = new Date();
    const dobFilter: Record<string, Date> = {};
    // ageMax N → born on/after today − N years
    if (filters.ageMax !== undefined) {
      dobFilter.$gte = new Date(
        now.getFullYear() - filters.ageMax,
        now.getMonth(),
        now.getDate(),
      );
    }
    // ageMin N → born on/before today − N years
    if (filters.ageMin !== undefined) {
      dobFilter.$lte = new Date(
        now.getFullYear() - filters.ageMin,
        now.getMonth(),
        now.getDate(),
      );
    }
    query.dateOfBirth = dobFilter;
  }
  if (filters.valueMin !== undefined || filters.valueMax !== undefined) {
    const valueFilter: Record<string, number> = {};
    if (filters.valueMin !== undefined) valueFilter.$gte = filters.valueMin;
    if (filters.valueMax !== undefined) valueFilter.$lte = filters.valueMax;
    query.estimatedValue = valueFilter;
  }

  const [docs, total] = await Promise.all([
    Horse.find(query)
      .sort({ updatedAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean(),
    Horse.countDocuments(query),
  ]);

  return {
    horses: (docs as Record<string, unknown>[]).map(toHorseListItem),
    total,
    page,
    limit,
  };
}

export async function updateHorseDiscovery(
  actorUserId: string,
  horseId: string,
  input: UpdateHorseDiscoveryInput,
) {
  ensureObjectId(actorUserId, "user id");
  ensureObjectId(horseId, "horse id");

  if (input.profileVisibility === undefined) {
    throw new ApiError(400, "No discovery fields to update", "VALIDATION_ERROR");
  }

  const updated = await Horse.findOneAndUpdate(
    {
      _id: horseId,
      ...ownedByUserQuery(actorUserId),
    },
    { $set: { profileVisibility: input.profileVisibility } },
    { returnDocument: "after" },
  ).lean();

  if (!updated) {
    throw new ApiError(404, "Horse not found", "NOT_FOUND");
  }

  return updated as Record<string, unknown>;
}

/**
 * Layer-2 Hub section visibility — targeted `$set` only (avoids full-document
 * validation on unrelated legacy fields like invalid breed).
 */
export async function updateHorseHubSections(
  actorUserId: string,
  horseId: string,
  input: UpdateHorseHubSectionsInput,
) {
  ensureObjectId(actorUserId, "user id");
  ensureObjectId(horseId, "horse id");

  const horse = await Horse.findOne({
    _id: horseId,
    ...ownedByUserQuery(actorUserId),
  })
    .select("hubSections")
    .lean();

  if (!horse) {
    throw new ApiError(404, "Horse not found", "NOT_FOUND");
  }

  const current = normalizeHubSections(horse.hubSections as HubSections | undefined);
  const next = { ...current };
  let changed = false;
  for (const key of horseHubSectionKeys) {
    const section = input.hubSections[key];
    if (section?.mode !== undefined) {
      next[key] = { mode: section.mode };
      changed = true;
    }
  }

  if (!changed) {
    throw new ApiError(400, "No hubSections fields to update", "VALIDATION_ERROR");
  }

  const updated = await Horse.findOneAndUpdate(
    {
      _id: horseId,
      ...ownedByUserQuery(actorUserId),
    },
    { $set: { hubSections: next } },
    { returnDocument: "after" },
  ).lean();

  if (!updated) {
    throw new ApiError(404, "Horse not found", "NOT_FOUND");
  }

  return updated as Record<string, unknown>;
}

export async function updateHorseProfile(
  actorUserId: string,
  horseId: string,
  input: z.infer<typeof updateHorseProfileSchema>,
) {
  ensureObjectId(actorUserId, "user id");
  ensureObjectId(horseId, "horse id");

  const horse = await Horse.findById(horseId).select(
    "mainOwnerUserId coOwners responsibles registryId microchipId passportNumber",
  );
  if (!horse) {
    throw new ApiError(404, "Horse not found");
  }

  if (!userOwnsEntity(actorUserId, horse.toObject())) {
    throw new ApiError(403, "Only the owner or co-owner can edit this horse");
  }

  const updates: Record<string, unknown> = {};
  const unset: Record<string, 1> = {};

  for (const [key, value] of Object.entries(input)) {
    if (value === undefined) continue;

    if (key === "pedigree") {
      if (typeof value === "object" && value !== null) {
        for (const [pedKey, pedValue] of Object.entries(value)) {
          if (pedValue !== undefined) {
            updates[`pedigree.${pedKey}`] = pedValue;
          }
        }
      }
      continue;
    }

    if (key === "registryId" || key === "microchipId" || key === "passportNumber") {
      const normalized = typeof value === "string" ? value : "";
      if (normalized) {
        updates[key] = normalized;
      } else {
        unset[key] = 1;
      }
      continue;
    }

    updates[key] = value;
  }

  const mergedIdentity = {
    registryId:
      updates.registryId !== undefined
        ? String(updates.registryId)
        : unset.registryId
          ? ""
          : (horse.registryId as string | undefined),
    microchipId:
      updates.microchipId !== undefined
        ? String(updates.microchipId)
        : unset.microchipId
          ? ""
          : (horse.microchipId as string | undefined),
    passportNumber:
      updates.passportNumber !== undefined
        ? String(updates.passportNumber)
        : unset.passportNumber
          ? ""
          : (horse.passportNumber as string | undefined),
  };

  if (
    input.registryId !== undefined ||
    input.microchipId !== undefined ||
    input.passportNumber !== undefined
  ) {
    if (!hasAtLeastOneHorseIdentity(mergedIdentity)) {
      throw new ApiError(400, HORSE_IDENTITY_REQUIRED_MESSAGE, "VALIDATION_ERROR");
    }
  }

  const updateOps: Record<string, unknown> = {};
  if (Object.keys(updates).length > 0) updateOps.$set = updates;
  if (Object.keys(unset).length > 0) updateOps.$unset = unset;

  const updated = await Horse.findByIdAndUpdate(horseId, updateOps, { new: true }).lean();

  return updated;
}

export async function getHorseForOwner(actorUserId: string, horseId: string) {
  ensureObjectId(actorUserId, "user id");
  ensureObjectId(horseId, "horse id");

  const horse = await Horse.findOne({
    _id: horseId,
    ...ownedByUserQuery(actorUserId),
  }).lean();
  if (!horse) {
    throw new ApiError(404, "Horse not found", "NOT_FOUND");
  }
  return horse as Record<string, unknown>;
}

async function resolveUserDetails(userId: string): Promise<{
  label: string;
  email: string;
  phone?: string;
  imageUrl?: string;
  countryCode?: string;
}> {
  const user = await User.findById(userId)
    .select(
      "personalDetails.firstName personalDetails.lastName personalDetails.username personalDetails.email personalDetails.phoneNumber personalDetails.imageUrl personalDetails.nationality",
    )
    .lean();
  const pd = user?.personalDetails as
    | {
        firstName?: string;
        lastName?: string;
        username?: string;
        email?: string;
        phoneNumber?: string;
        imageUrl?: string;
        nationality?: string;
      }
    | undefined;
  const imageUrl =
    typeof pd?.imageUrl === "string" && pd.imageUrl.trim() ? pd.imageUrl.trim() : undefined;
  const nationality =
    typeof pd?.nationality === "string" ? pd.nationality.trim().toUpperCase() : "";
  const countryCode = nationality.length === 2 ? nationality : undefined;
  return {
    label:
      [pd?.firstName, pd?.lastName].filter(Boolean).join(" ").trim() ||
      pd?.username?.trim() ||
      "A user",
    email: pd?.email ?? "",
    phone: pd?.phoneNumber,
    imageUrl,
    countryCode,
  };
}

/** Hub-safe pedigree parent projection (name/image/country only — no email/phone). */
async function resolvePedigreeParentSummary(
  horseId: string,
): Promise<HorseHubPedigreeParentSummary | undefined> {
  const parent = await Horse.findById(horseId)
    .select("name profileImageUrl countryOfBirth")
    .lean();
  if (!parent) return undefined;
  return {
    horseId: String(parent._id),
    name: parent.name as string | undefined,
    imageUrl: parent.profileImageUrl as string | undefined,
    countryCode: parent.countryOfBirth as string | undefined,
  };
}

/** Owner hub summary — includes role flags, co-owner/responsible lists, and admin team roster. */
export async function getOwnerHorseHubSummary(
  actorUserId: string,
  horseId: string,
): Promise<OwnerHorseHubSummary> {
  const horse = await getHorseForOwner(actorUserId, horseId);
  const isMainOwner = String(horse.mainOwnerUserId) === actorUserId;
  const isCoOwner = (Array.isArray(horse.coOwners) ? horse.coOwners : []).some(
    (c: { userId?: unknown }) => c.userId != null && String(c.userId) === actorUserId,
  );
  const isResponsible = (Array.isArray(horse.responsibles) ? horse.responsibles : []).some(
    (r: { userId?: unknown }) => r.userId != null && String(r.userId) === actorUserId,
  );
  const isAdmin = isMainOwner || isCoOwner || isResponsible;

  const rawCoOwners = Array.isArray(horse.coOwners)
    ? (horse.coOwners as Array<{ userId?: unknown; ownershipPercentage?: number; joinedAt?: unknown }>)
    : [];

  const coOwners: OwnerHorseCoOwner[] = [];
  for (const entry of rawCoOwners) {
    if (entry.userId == null) continue;
    const userId = String(entry.userId);
    const details = await resolveUserDetails(userId);
    coOwners.push({
      userId,
      label: details.label,
      ownershipPercentage: Number(entry.ownershipPercentage ?? 0),
      email: details.email,
      phone: details.phone,
      imageUrl: details.imageUrl,
      countryCode: details.countryCode,
      joinedAt: entry.joinedAt instanceof Date ? entry.joinedAt.toISOString() : undefined,
    });
  }

  const rawResponsibles = Array.isArray(horse.responsibles)
    ? (horse.responsibles as Array<{ userId?: unknown; joinedAt?: unknown }>)
    : [];

  const responsibles: OwnerHorseResponsible[] = [];
  for (const entry of rawResponsibles) {
    if (entry.userId == null) continue;
    const userId = String(entry.userId);
    const details = await resolveUserDetails(userId);
    responsibles.push({
      userId,
      label: details.label,
      email: details.email,
      phone: details.phone,
      imageUrl: details.imageUrl,
      countryCode: details.countryCode,
      joinedAt: entry.joinedAt instanceof Date ? entry.joinedAt.toISOString() : undefined,
    });
  }

  const mainOwnerDetails = await resolveUserDetails(String(horse.mainOwnerUserId));
  const acquisitionSourceUserId = horse.acquisitionSourceUserId
    ? String(horse.acquisitionSourceUserId)
    : undefined;
  const acquisitionSourceUser = acquisitionSourceUserId
    ? await resolveUserDetails(acquisitionSourceUserId)
    : mainOwnerDetails;
  const acquisitionSourceUserResolved = {
    userId: acquisitionSourceUserId ?? String(horse.mainOwnerUserId),
    name: acquisitionSourceUser.label,
    email: acquisitionSourceUser.email,
    imageUrl: acquisitionSourceUser.imageUrl,
    countryCode: acquisitionSourceUser.countryCode,
  };
  const adminTeam: AdminTeamMember[] = [
    {
      userId: String(horse.mainOwnerUserId),
      type: "owner",
      name: mainOwnerDetails.label,
      email: mainOwnerDetails.email,
      phone: mainOwnerDetails.phone,
      imageUrl: mainOwnerDetails.imageUrl,
      countryCode: mainOwnerDetails.countryCode,
      joinedAt: (horse.createdAt instanceof Date ? horse.createdAt : new Date()).toISOString(),
    },
    ...coOwners.map((c) => ({
      userId: c.userId,
      type: "co_owner" as const,
      name: c.label,
      email: c.email ?? "",
      phone: c.phone,
      imageUrl: c.imageUrl,
      countryCode: c.countryCode,
      joinedAt: c.joinedAt ?? "",
    })),
    ...responsibles.map((r) => ({
      userId: r.userId,
      type: "responsible" as const,
      name: r.label,
      email: r.email ?? "",
      phone: r.phone,
      imageUrl: r.imageUrl,
      countryCode: r.countryCode,
      joinedAt: r.joinedAt ?? "",
    })),
  ];

  return {
    id: String(horse._id),
    name: horse.name as string | undefined,
    breed: horse.breed as string | undefined,
    sex: horse.sex as string | undefined,
    registeredName: horse.registeredName as string | undefined,
    registryId: horse.registryId as string | undefined,
    microchipId: horse.microchipId as string | undefined,
    passportNumber: horse.passportNumber as string | undefined,
    dateOfBirth: horse.dateOfBirth instanceof Date ? horse.dateOfBirth.toISOString() : undefined,
    color: horse.color as string | undefined,
    heightHands: horse.heightHands as number | undefined,
    disciplines: horse.disciplines as string[] | undefined,
    countryOfBirth: horse.countryOfBirth as string | undefined,
    estimatedValue: horse.estimatedValue as number | undefined,
    valueCurrency: horse.valueCurrency as string | undefined,
    saleStatus: horse.saleStatus as string | undefined,
    askingPrice: horse.askingPrice as number | undefined,
    acquisitionDate: horse.acquisitionDate instanceof Date ? horse.acquisitionDate.toISOString() : undefined,
    acquisitionSourceUserId,
    acquisitionSourceUser: acquisitionSourceUserResolved,
    pedigree: horse.pedigree as Record<string, unknown> | undefined,
    profileImageUrl: horse.profileImageUrl as string | undefined,
    description: horse.description as string | undefined,
    notes: horse.notes as string | undefined,
    profileVisibility: horse.profileVisibility as string | undefined,
    hubSections: normalizeHubSections(horse.hubSections as HubSections | undefined),
    isMainOwner,
    isCoOwner,
    isResponsible,
    isAdmin,
    coOwners,
    responsibles,
    adminTeam,
  };
}

export async function getHorseHub(
  horseId: string,
  requester?: { id?: string; isAuthenticated: boolean },
): Promise<HorseHubDto> {
  ensureObjectId(horseId, "horse id");

  const horse = await Horse.findById(horseId).lean();
  if (!horse) {
    throw new ApiError(404, "Horse not found", "NOT_FOUND");
  }

  await assertPublicReadAllowed(horse as Record<string, unknown>, "Horse");

  const horseDoc = horse as Record<string, unknown>;
  const audience = await resolveHorseViewerAudience(horseDoc, requester?.id);
  assertCanViewHorseGlobal(horseDoc, audience);

  // Cheap Hub projections only — social lists via getHorseHubSocial
  const sections = buildHorseHubSections(horseDoc, audience);

  return {
    id: String(horseDoc._id),
    name: horseDoc.name as string | undefined,
    breed: horseDoc.breed as string | undefined,
    sex: horseDoc.sex as string | undefined,
    profileImageUrl: horseDoc.profileImageUrl as string | undefined,
    heroImageUrl: horseDoc.heroImageUrl as string | undefined,
    sections,
  };
}

/** Pure Hub profile section builder — used by getHorseHub and unit tests. */
export function buildHorseHubSections(
  horseDoc: Record<string, unknown>,
  audience: HorseViewerAudience,
): HorseHubDto["sections"] {
  const sections: HorseHubDto["sections"] = {};

  if (canViewHorseHubSection(horseDoc, "identity", audience)) {
    const dob = horseDoc.dateOfBirth;
    let age: number | undefined;
    if (dob instanceof Date) {
      age = new Date().getFullYear() - dob.getFullYear();
    } else if (typeof dob === "string" && dob.length > 0) {
      age = new Date().getFullYear() - new Date(dob).getFullYear();
    }
    let dateOfBirth: string | undefined;
    if (dob instanceof Date) {
      dateOfBirth = dob.toISOString();
    } else if (typeof dob === "string" && dob.length > 0) {
      dateOfBirth = dob;
    }

    sections.identity = {
      age,
      color: horseDoc.color as string | undefined,
      heightHands: horseDoc.heightHands as number | undefined,
      disciplines: horseDoc.disciplines as string[] | undefined,
      registeredName: horseDoc.registeredName as string | undefined,
      dateOfBirth,
      countryOfBirth: horseDoc.countryOfBirth as string | undefined,
    };
  }

  if (canViewHorseHubSection(horseDoc, "identification", audience)) {
    sections.identification = {
      registryId: horseDoc.registryId as string | undefined,
      microchipId: horseDoc.microchipId as string | undefined,
      passportNumber: horseDoc.passportNumber as string | undefined,
    };
  }

  if (canViewHorseHubSection(horseDoc, "pedigree", audience)) {
    const pedigree = (horseDoc.pedigree ?? {}) as Record<string, unknown>;
    const sireHorseId =
      pedigree.sireHorseId != null ? String(pedigree.sireHorseId) : undefined;
    const damHorseId =
      pedigree.damHorseId != null ? String(pedigree.damHorseId) : undefined;
    sections.pedigree = {
      sireName: pedigree.sireName as string | undefined,
      damName: pedigree.damName as string | undefined,
      bloodlineNotes: pedigree.bloodlineNotes as string | undefined,
      sireHorseId,
      damHorseId,
    };
  }

  if (canViewHorseHubSection(horseDoc, "about", audience)) {
    sections.about = {
      description: horseDoc.description as string | undefined,
    };
  }

  if (canViewHorseHubSection(horseDoc, "ownership", audience)) {
    const coOwners = Array.isArray(horseDoc.coOwners) ? horseDoc.coOwners : [];
    const coOwnerCount = coOwners.length;
    sections.ownership = {
      coOwnerCount,
      soleOwner: coOwnerCount === 0,
    };
  }

  if (canViewHorseHubSection(horseDoc, "value", audience)) {
    sections.value = {
      saleStatus: horseDoc.saleStatus as string | undefined,
      askingPrice: horseDoc.askingPrice as number | undefined,
      estimatedValue: horseDoc.estimatedValue as number | undefined,
      valueCurrency: horseDoc.valueCurrency as string | undefined,
      acquisitionDate:
        horseDoc.acquisitionDate instanceof Date
          ? horseDoc.acquisitionDate.toISOString()
          : typeof horseDoc.acquisitionDate === "string"
            ? horseDoc.acquisitionDate
            : undefined,
    };
  }

  if (canViewHorseHubSection(horseDoc, "proactiveRepresentatives", audience)) {
    sections.proactiveRepresentatives = { members: [] };
  }

  if (canViewHorseHubSection(horseDoc, "coOwnerManagement", audience)) {
    sections.coOwnerManagement = { members: [] };
  }

  return sections;
}

/** Layer-2 gallery / planning / connections for Hub social payload (GET …/hub-social). */
export async function attachHubSocialSections(
  sections: HorseHubSocialSections,
  horseDoc: Record<string, unknown>,
  audience: HorseViewerAudience,
  horseId: string,
): Promise<void> {
  if (canViewHorseHubSection(horseDoc, "gallery", audience)) {
    const media = await Media.find({ horseId, isActive: true })
      .sort({ createdAt: -1 })
      .lean();
    sections.gallery = media
      .filter((item) => {
        const record = item as Record<string, unknown>;
        if (record.isVisibleOnHub === false) return false;
        return canAccessByItemVisibilityMode(
          record.visibilityMode as string | undefined,
          audience,
        );
      })
      .map((item) => {
        const record = item as Record<string, unknown>;
        return {
          id: String(record._id),
          type: record.type as string,
          url: record.url as string,
          thumbnailUrl: record.thumbnailUrl as string | undefined,
          title: record.title as string | undefined,
        };
      });
  }

  if (canViewHorseHubSection(horseDoc, "planning", audience)) {
    const now = new Date();
    const events = await HorseEvent.find({
      horseId,
      isActive: true,
      startDate: { $gte: now },
    })
      .sort({ startDate: 1 })
      .limit(20)
      .lean();
    sections.planning = events
      .filter((item) =>
        canAccessByItemVisibilityMode(
          (item as Record<string, unknown>).visibilityMode as string | undefined,
          audience,
        ),
      )
      .map((item) => {
        const record = item as Record<string, unknown>;
        return {
          id: String(record._id),
          title: record.title as string,
          eventType: record.eventType as string,
          startDate: (record.startDate as Date).toISOString(),
          endDate: record.endDate ? (record.endDate as Date).toISOString() : undefined,
          location: record.location as string | undefined,
        };
      });
  }

  if (canViewHorseHubSection(horseDoc, "connections", audience)) {
    const relationships = await Relationship.find({
      horseId,
      status: "accepted",
    })
      .sort({ respondedAt: -1 })
      .lean();
    sections.connections = relationships.map((item) => {
      const record = item as Record<string, unknown>;
      const historical = record.historicalReference as
        | { receiverLabel?: string; requesterLabel?: string }
        | undefined;
      const displayName =
        historical?.receiverLabel ||
        historical?.requesterLabel ||
        String(record.relationshipType);
      return {
        id: String(record._id),
        relationshipType: String(record.relationshipType),
        displayName,
      };
    });
  }
}

/**
 * Guest-safe Hub social lists (gallery / planning / connections).
 * Not part of the shared horse view — call only from Hub (GET …/hub-social).
 */
export async function getHorseHubSocial(
  horseId: string,
  userId?: string | null,
): Promise<HorseHubSocialResponse> {
  ensureObjectId(horseId, "horse id");

  const horse = await Horse.findById(horseId).lean();
  if (!horse) {
    throw new ApiError(404, "Horse not found", "NOT_FOUND");
  }

  await assertPublicReadAllowed(horse as Record<string, unknown>, "Horse");

  const horseDoc = horse as Record<string, unknown>;
  const audience = await resolveHorseViewerAudience(horseDoc, userId ?? undefined);
  assertCanViewHorseGlobal(horseDoc, audience);

  const sections: HorseHubSocialSections = {};
  await attachHubSocialSections(sections, horseDoc, audience, horseId);

  return { sections };
}

// --- Role derivation helpers (exported for testing) ---

export const ROLE_ORDER: ViewerRole[] = [
  "guest",
  "public",
  "related",
  "responsible",
  "co_owner",
  "main_owner",
];

/** Map of minimum role required to access each tab. */
export const TAB_MIN_ROLE: Record<HorseTab, ViewerRole> = {
  hub: "guest",
  planning: "related",
  media: "related",
  documents: "related",
  connect: "responsible",
  profile: "responsible",
  history: "responsible",
  admin: "main_owner",
};

function deriveViewerRole(
  audience: HorseViewerAudience,
  horseDoc: Record<string, unknown>,
  userId?: string | null,
): ViewerRole {
  if (!userId) return "guest";
  if (audience.isOwnerTeam) {
    const isMainOwner = String(horseDoc.mainOwnerUserId) === userId;
    if (isMainOwner) return "main_owner";
    const isCoOwner = (Array.isArray(horseDoc.coOwners) ? horseDoc.coOwners : []).some(
      (c: { userId?: unknown }) => c.userId != null && String(c.userId) === userId,
    );
    if (isCoOwner) return "co_owner";
    return "responsible";
  }
  if (audience.isRelationshipAudience) return "related";
  return "public";
}

export function deriveAllowedTabs(viewerRole: ViewerRole): HorseTab[] {
  const roleIndex = ROLE_ORDER.indexOf(viewerRole);
  return (Object.keys(TAB_MIN_ROLE) as HorseTab[]).filter((tab) => {
    const minIndex = ROLE_ORDER.indexOf(TAB_MIN_ROLE[tab]);
    return roleIndex >= minIndex;
  });
}

/**
 * Unified role-aware horse view — single endpoint for all horse tabs.
 * Returns role-scoped horse data, the viewer's role, and the tabs they may access.
 * Owner-team viewers receive full owner fields; others receive only Hub-filtered
 * cheap section projections. Gallery / planning / connections lists are loaded
 * separately via getHorseHubSocial.
 */
export async function getHorseView(
  horseId: string,
  userId?: string | null,
): Promise<HorseViewResponse> {
  ensureObjectId(horseId, "horse id");

  const horse = await Horse.findById(horseId).lean();
  if (!horse) {
    throw new ApiError(404, "Horse not found", "NOT_FOUND");
  }

  await assertPublicReadAllowed(horse as Record<string, unknown>, "Horse");

  const horseDoc = horse as Record<string, unknown>;
  const audience = await resolveHorseViewerAudience(horseDoc, userId ?? undefined);
  assertCanViewHorseGlobal(horseDoc, audience);

  const viewerRole = deriveViewerRole(audience, horseDoc, userId);
  const allowedTabs = deriveAllowedTabs(viewerRole);

  // Cheap Hub section projections only (no Media / Event / Relationship queries)
  const sections = buildHorseHubSections(horseDoc, audience);

  // Hub-safe enrichment for value / ownership / proactive / co-owner sections
  // (L2 + L1 only — NOT gated by isOwnerTeam). No email or phone on Hub projections.
  if (sections.value) {
    const acquisitionSourceUserId = horseDoc.acquisitionSourceUserId
      ? String(horseDoc.acquisitionSourceUserId)
      : undefined;
    const acquisitionSourceDetails = acquisitionSourceUserId
      ? await resolveUserDetails(acquisitionSourceUserId)
      : await resolveUserDetails(String(horseDoc.mainOwnerUserId));
    sections.value.acquisitionSourceUser = {
      userId: acquisitionSourceUserId ?? String(horseDoc.mainOwnerUserId),
      name: acquisitionSourceDetails.label,
      imageUrl: acquisitionSourceDetails.imageUrl,
      countryCode: acquisitionSourceDetails.countryCode,
    };
  }

  if (sections.ownership) {
    const mainOwnerUserId = String(horseDoc.mainOwnerUserId);
    const mainOwnerDetails = await resolveUserDetails(mainOwnerUserId);
    sections.ownership.mainOwner = {
      userId: mainOwnerUserId,
      name: mainOwnerDetails.label,
      imageUrl: mainOwnerDetails.imageUrl,
      countryCode: mainOwnerDetails.countryCode,
    };
  }

  if (sections.proactiveRepresentatives) {
    const rawResponsibles = (
      Array.isArray(horseDoc.responsibles) ? horseDoc.responsibles : []
    ).filter((r) => r.userId != null);
    const details = await Promise.all(
      rawResponsibles.map((r) => resolveUserDetails(String(r.userId))),
    );
    sections.proactiveRepresentatives.members = rawResponsibles.map((entry, i) => ({
      userId: String(entry.userId),
      name: details[i]?.label,
      imageUrl: details[i]?.imageUrl,
      countryCode: details[i]?.countryCode,
    }));
  }

  if (sections.coOwnerManagement) {
    const rawCoOwners = (
      Array.isArray(horseDoc.coOwners) ? horseDoc.coOwners : []
    ).filter((c) => c.userId != null);
    const details = await Promise.all(
      rawCoOwners.map((c) => resolveUserDetails(String(c.userId))),
    );
    sections.coOwnerManagement.members = rawCoOwners.map((entry, i) => ({
      userId: String(entry.userId),
      name: details[i]?.label,
      imageUrl: details[i]?.imageUrl,
      countryCode: details[i]?.countryCode,
    }));
  }

  // Pedigree — inline hub-safe parent summaries so the Hub renders chips without
  // a per-parent client fetch (kills the N+1 on HorseHubPedigree).
  if (sections.pedigree) {
    const [sireSummary, damSummary] = await Promise.all([
      sections.pedigree.sireHorseId
        ? resolvePedigreeParentSummary(sections.pedigree.sireHorseId)
        : Promise.resolve(undefined),
      sections.pedigree.damHorseId
        ? resolvePedigreeParentSummary(sections.pedigree.damHorseId)
        : Promise.resolve(undefined),
    ]);
    sections.pedigree.sireSummary = sireSummary;
    sections.pedigree.damSummary = damSummary;
  }

  const horseView: HorseViewDto = {
    id: String(horseDoc._id),
    name: horseDoc.name as string | undefined,
    breed: horseDoc.breed as string | undefined,
    sex: horseDoc.sex as string | undefined,
    profileImageUrl: horseDoc.profileImageUrl as string | undefined,
    heroImageUrl: horseDoc.heroImageUrl as string | undefined,
    profileVisibility: horseDoc.profileVisibility as string | undefined,
    sections,
  };

  // Merge owner-team-only fields when viewer is on the ownership team
  if (audience.isOwnerTeam && userId) {
    const isMainOwner = String(horseDoc.mainOwnerUserId) === userId;
    const isCoOwner = (Array.isArray(horseDoc.coOwners) ? horseDoc.coOwners : []).some(
      (c: { userId?: unknown }) => c.userId != null && String(c.userId) === userId,
    );
    const isResponsible = (Array.isArray(horseDoc.responsibles) ? horseDoc.responsibles : []).some(
      (r: { userId?: unknown }) => r.userId != null && String(r.userId) === userId,
    );

    const rawCoOwners = (
      Array.isArray(horseDoc.coOwners)
        ? (horseDoc.coOwners as Array<{ userId?: unknown; ownershipPercentage?: number; joinedAt?: unknown }>)
        : []
    ).filter((c) => c.userId != null);

    const rawResponsibles = (
      Array.isArray(horseDoc.responsibles)
        ? (horseDoc.responsibles as Array<{ userId?: unknown; joinedAt?: unknown }>)
        : []
    ).filter((r) => r.userId != null);

    const acquisitionSourceUserId = horseDoc.acquisitionSourceUserId
      ? String(horseDoc.acquisitionSourceUserId)
      : undefined;

    const [coOwnerDetails, responsibleDetails, mainOwnerDetails, acquisitionSourceDetails] =
      await Promise.all([
        Promise.all(rawCoOwners.map((c) => resolveUserDetails(String(c.userId)))),
        Promise.all(rawResponsibles.map((r) => resolveUserDetails(String(r.userId)))),
        resolveUserDetails(String(horseDoc.mainOwnerUserId)),
        acquisitionSourceUserId ? resolveUserDetails(acquisitionSourceUserId) : Promise.resolve(null),
      ]);

    const resolvedAcquisitionSource =
      acquisitionSourceUserId && acquisitionSourceDetails
        ? {
            userId: acquisitionSourceUserId,
            name: acquisitionSourceDetails.label,
            email: acquisitionSourceDetails.email,
            imageUrl: acquisitionSourceDetails.imageUrl,
            countryCode: acquisitionSourceDetails.countryCode,
          }
        : {
            userId: String(horseDoc.mainOwnerUserId),
            name: mainOwnerDetails.label,
            email: mainOwnerDetails.email,
            imageUrl: mainOwnerDetails.imageUrl,
            countryCode: mainOwnerDetails.countryCode,
          };

    const coOwners: OwnerHorseCoOwner[] = rawCoOwners.map((entry, i) => ({
      userId: String(entry.userId),
      label: coOwnerDetails[i].label,
      ownershipPercentage: Number(entry.ownershipPercentage ?? 0),
      email: coOwnerDetails[i].email,
      phone: coOwnerDetails[i].phone,
      imageUrl: coOwnerDetails[i].imageUrl,
      countryCode: coOwnerDetails[i].countryCode,
      joinedAt: entry.joinedAt instanceof Date ? entry.joinedAt.toISOString() : undefined,
    }));

    const responsibles: OwnerHorseResponsible[] = rawResponsibles.map((entry, i) => ({
      userId: String(entry.userId),
      label: responsibleDetails[i].label,
      email: responsibleDetails[i].email,
      phone: responsibleDetails[i].phone,
      imageUrl: responsibleDetails[i].imageUrl,
      countryCode: responsibleDetails[i].countryCode,
      joinedAt: entry.joinedAt instanceof Date ? entry.joinedAt.toISOString() : undefined,
    }));

    const adminTeam: AdminTeamMember[] = [
      {
        userId: String(horseDoc.mainOwnerUserId),
        type: "owner",
        name: mainOwnerDetails.label,
        email: mainOwnerDetails.email,
        phone: mainOwnerDetails.phone,
        imageUrl: mainOwnerDetails.imageUrl,
        countryCode: mainOwnerDetails.countryCode,
        joinedAt: (horseDoc.createdAt instanceof Date ? horseDoc.createdAt : new Date()).toISOString(),
      },
      ...coOwners.map((c) => ({
        userId: c.userId,
        type: "co_owner" as const,
        name: c.label,
        email: c.email ?? "",
        phone: c.phone,
        imageUrl: c.imageUrl,
        countryCode: c.countryCode,
        joinedAt: c.joinedAt ?? "",
      })),
      ...responsibles.map((r) => ({
        userId: r.userId,
        type: "responsible" as const,
        name: r.label,
        email: r.email ?? "",
        phone: r.phone,
        imageUrl: r.imageUrl,
        countryCode: r.countryCode,
        joinedAt: r.joinedAt ?? "",
      })),
    ];

    Object.assign(horseView, {
      registeredName: horseDoc.registeredName as string | undefined,
      registryId: horseDoc.registryId as string | undefined,
      microchipId: horseDoc.microchipId as string | undefined,
      passportNumber: horseDoc.passportNumber as string | undefined,
      dateOfBirth:
        horseDoc.dateOfBirth instanceof Date ? horseDoc.dateOfBirth.toISOString() : undefined,
      color: horseDoc.color as string | undefined,
      heightHands: horseDoc.heightHands as number | undefined,
      disciplines: horseDoc.disciplines as string[] | undefined,
      countryOfBirth: horseDoc.countryOfBirth as string | undefined,
      estimatedValue: horseDoc.estimatedValue as number | undefined,
      valueCurrency: horseDoc.valueCurrency as string | undefined,
      saleStatus: horseDoc.saleStatus as string | undefined,
      askingPrice: horseDoc.askingPrice as number | undefined,
      acquisitionDate:
        horseDoc.acquisitionDate instanceof Date
          ? horseDoc.acquisitionDate.toISOString()
          : undefined,
      acquisitionSourceUserId,
      acquisitionSourceUser: resolvedAcquisitionSource,
      pedigree: horseDoc.pedigree as Record<string, unknown> | undefined,
      description: horseDoc.description as string | undefined,
      notes: horseDoc.notes as string | undefined,
      hubSections: normalizeHubSections(horseDoc.hubSections as HubSections | undefined),
      isMainOwner,
      isCoOwner,
      isResponsible,
      isAdmin: isMainOwner || isCoOwner || isResponsible,
      coOwners,
      responsibles,
      adminTeam,
    } satisfies Partial<HorseViewDto>);
  }

  return { viewerRole, allowedTabs, horse: horseView };
}