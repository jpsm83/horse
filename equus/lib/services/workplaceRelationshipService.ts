/**
 * Workplace relationship service — collaboration invites, accept/decline, workplaces listing.
 *
 * Called by REST routes under workplace-relationships and users/me/workplace-invitations.
 * Collaborators are Users; access is via WorkplaceRelationship, never User.*ProfileIds.
 */

import mongoose from "mongoose";
import WorkplaceRelationship from "../../models/WorkplaceRelationship.ts";
import Stable from "../../models/Stable.ts";
import Breeder from "../../models/Breeder.ts";
import RidingClub from "../../models/RidingClub.ts";
import Transport from "../../models/Transport.ts";
import User from "../../models/User.ts";
import { ApiError } from "../api/errors.ts";
import { requireRoleProfileAccess } from "../auth/requireRoleProfileAccess.ts";
import {
  findBusinessRoleProfile,
  type BusinessRoleType,
} from "../roleProfiles/businessRoleProfile.ts";
import type { z } from "zod";
import type { inviteCollaboratorSchema } from "../validations/workplaceRelationship.ts";
import { sendStaffInviteEmail } from "../email/sendStaffInviteEmail.ts";

export type InviteCollaboratorInput = z.infer<typeof inviteCollaboratorSchema>;

export type UpdateCollaboratorInput = {
  hierarchyLevel?: InviteCollaboratorInput["hierarchyLevel"];
  title?: string;
  description?: string;
};

export type PublicCollaborationUser = {
  id: string;
  email?: string;
  firstName?: string;
  lastName?: string;
};

export type PublicWorkplaceRelationship = {
  id: string;
  hostRoleType: BusinessRoleType;
  hostRoleProfileId: string;
  hierarchyLevel: string;
  status: string;
  active: boolean;
  title?: string;
  description?: string;
  invitedEmail: string;
  user?: PublicCollaborationUser;
  invitedByUserId: string;
  acceptedAt?: Date;
  createdAt?: Date;
  updatedAt?: Date;
};

/** @deprecated Use PublicWorkplaceRelationship */
export type PublicMembership = PublicWorkplaceRelationship & {
  roleType: BusinessRoleType;
  roleProfileId: string;
  staffRole: string;
};

export type PublicWorkplace = {
  roleType: BusinessRoleType;
  roleProfileId: string;
  access: "owner" | "collaborator";
  hierarchyLevel?: string;
  /** @deprecated Use hierarchyLevel */
  staffRole?: string;
  status?: string;
  workplaceRelationshipId?: string;
  /** @deprecated Use workplaceRelationshipId */
  membershipId?: string;
  profileName?: string;
};

const ACTIVE_INVITE_STATUSES = ["invited", "active"] as const;

const MODEL_BY_ROLE_TYPE = {
  stable: Stable,
  breeder: Breeder,
  ridingClub: RidingClub,
  transport: Transport,
} as const;

const NAME_FIELD_BY_ROLE_TYPE: Record<BusinessRoleType, string> = {
  stable: "tradeName",
  breeder: "operationName",
  ridingClub: "clubName",
  transport: "companyName",
};

// --- API mapping ---

export function toPublicCollaborationUser(
  doc: Record<string, unknown> | null | undefined,
): PublicCollaborationUser | undefined {
  if (!doc) return undefined;

  const personalDetails = (doc.personalDetails ?? {}) as Record<string, unknown>;

  return {
    id: String(doc._id),
    email: personalDetails.email as string | undefined,
    firstName: personalDetails.firstName as string | undefined,
    lastName: personalDetails.lastName as string | undefined,
  };
}

export function toPublicWorkplaceRelationship(
  doc: Record<string, unknown>,
): PublicWorkplaceRelationship {
  const userDoc = doc.userId as Record<string, unknown> | undefined;
  const populatedUser =
    userDoc && typeof userDoc === "object" && userDoc._id != null ? userDoc : undefined;

  const hostRoleType = (doc.hostRoleType ?? doc.roleType) as BusinessRoleType;
  const hostRoleProfileId = String(doc.hostRoleProfileId ?? doc.roleProfileId);
  const hierarchyLevel = String(doc.hierarchyLevel ?? doc.staffRole);

  return {
    id: String(doc._id),
    hostRoleType,
    hostRoleProfileId,
    hierarchyLevel,
    status: String(doc.status),
    active: doc.active === true,
    title: doc.title as string | undefined,
    description: doc.description as string | undefined,
    invitedEmail: String(doc.invitedEmail),
    user: toPublicCollaborationUser(populatedUser),
    invitedByUserId: String(doc.invitedByUserId),
    acceptedAt: doc.acceptedAt as Date | undefined,
    createdAt: doc.createdAt as Date | undefined,
    updatedAt: doc.updatedAt as Date | undefined,
  };
}

/** @deprecated Use toPublicWorkplaceRelationship */
export function toPublicMembership(doc: Record<string, unknown>): PublicMembership {
  const base = toPublicWorkplaceRelationship(doc);
  return {
    ...base,
    roleType: base.hostRoleType,
    roleProfileId: base.hostRoleProfileId,
    staffRole: base.hierarchyLevel,
  };
}

// --- Stable.collaborators sync ---

async function addCollaboratorToStableIndex(
  hostRoleType: BusinessRoleType,
  hostRoleProfileId: string,
  relationshipId: mongoose.Types.ObjectId,
) {
  if (hostRoleType !== "stable") return;

  await Stable.findByIdAndUpdate(hostRoleProfileId, {
    $addToSet: { collaborators: relationshipId },
  });
}

async function removeCollaboratorFromStableIndex(
  hostRoleType: BusinessRoleType,
  hostRoleProfileId: string,
  relationshipId: mongoose.Types.ObjectId,
) {
  if (hostRoleType !== "stable") return;

  await Stable.findByIdAndUpdate(hostRoleProfileId, {
    $pull: { collaborators: relationshipId },
  });
}

// --- Internal helpers ---

async function getCollaborationForProfile(
  hostRoleType: BusinessRoleType,
  hostRoleProfileId: string,
  relationshipId: string,
) {
  if (!mongoose.Types.ObjectId.isValid(relationshipId)) {
    throw new ApiError(404, "Workplace relationship not found", "NOT_FOUND");
  }

  const collaboration = await WorkplaceRelationship.findOne({
    _id: relationshipId,
    hostRoleType,
    hostRoleProfileId,
  });

  if (!collaboration) {
    throw new ApiError(404, "Workplace relationship not found", "NOT_FOUND");
  }

  return collaboration;
}

async function assertInviteeIdentity(
  userId: string,
  collaboration: InstanceType<typeof WorkplaceRelationship>,
) {
  if (collaboration.userId && String(collaboration.userId) === userId) {
    return;
  }

  const user = await User.findById(userId).select("personalDetails.email").lean();
  const userEmail = (user?.personalDetails as { email?: string } | undefined)?.email
    ?.toLowerCase()
    .trim();

  if (userEmail && userEmail === collaboration.invitedEmail.toLowerCase().trim()) {
    return;
  }

  throw new ApiError(403, "You are not the invitee for this collaboration", "FORBIDDEN");
}

async function getProfileDisplayName(
  hostRoleType: BusinessRoleType,
  hostRoleProfileId: string,
): Promise<string | undefined> {
  const Model = MODEL_BY_ROLE_TYPE[hostRoleType];
  const field = NAME_FIELD_BY_ROLE_TYPE[hostRoleType];
  const profile = await Model.findById(hostRoleProfileId).select(field).lean();
  if (!profile) return undefined;
  return (profile as Record<string, unknown>)[field] as string | undefined;
}

// --- Collaboration management ---

export async function inviteCollaborator(
  actorUserId: string,
  hostRoleType: BusinessRoleType,
  hostRoleProfileId: string,
  input: InviteCollaboratorInput,
): Promise<PublicWorkplaceRelationship> {
  await requireRoleProfileAccess(
    actorUserId,
    hostRoleType,
    hostRoleProfileId,
    "manage_collaborators",
  );

  const resolved = await findBusinessRoleProfile(hostRoleType, hostRoleProfileId);
  if (!resolved) {
    throw new ApiError(404, "Role profile not found", "NOT_FOUND");
  }

  const normalizedEmail = input.email.toLowerCase().trim();
  const invitee = await User.findOne({ "personalDetails.email": normalizedEmail }).lean();

  if (invitee && String(invitee._id) === resolved.ownerUserId) {
    throw new ApiError(400, "Cannot invite the profile owner as collaborator", "VALIDATION_ERROR");
  }

  const duplicateQuery = invitee
    ? {
        hostRoleType,
        hostRoleProfileId,
        status: { $in: ACTIVE_INVITE_STATUSES },
        $or: [{ userId: invitee._id }, { invitedEmail: normalizedEmail }],
      }
    : {
        hostRoleType,
        hostRoleProfileId,
        status: { $in: ACTIVE_INVITE_STATUSES },
        invitedEmail: normalizedEmail,
      };

  const existing = await WorkplaceRelationship.findOne(duplicateQuery).lean();
  if (existing) {
    throw new ApiError(
      409,
      "This user or email already has a pending or active collaboration for this profile",
      "CONFLICT",
    );
  }

  const collaboration = await WorkplaceRelationship.create({
    hostRoleType,
    hostRoleProfileId,
    invitedEmail: normalizedEmail,
    ...(invitee ? { userId: invitee._id } : {}),
    hierarchyLevel: input.hierarchyLevel,
    title: input.title,
    description: input.description,
    status: "invited",
    active: false,
    invitedByUserId: actorUserId,
  });

  const profileName =
    (await getProfileDisplayName(hostRoleType, hostRoleProfileId)) ?? "your organization";

  try {
    const inviteeLocale = invitee
      ? (
          invitee.personalDetails as { preferredLanguage?: string } | undefined
        )?.preferredLanguage
      : undefined;

    await sendStaffInviteEmail({
      membershipId: String(collaboration._id),
      invitedEmail: normalizedEmail,
      profileName,
      roleType: hostRoleType,
      staffRole: input.hierarchyLevel,
      invitedByUserId: actorUserId,
      inviteeUserId: invitee ? String(invitee._id) : undefined,
      locale: inviteeLocale,
    });
  } catch (error) {
    await WorkplaceRelationship.deleteOne({ _id: collaboration._id });
    console.error("Failed to send collaboration invite email:", error);
    throw new ApiError(500, "Failed to send invitation email. Please try again later.", "INTERNAL_ERROR");
  }

  return toPublicWorkplaceRelationship(collaboration.toObject() as Record<string, unknown>);
}

/** @deprecated Use inviteCollaborator */
export const inviteStaff = inviteCollaborator;

export async function listCollaborators(
  actorUserId: string,
  hostRoleType: BusinessRoleType,
  hostRoleProfileId: string,
): Promise<PublicWorkplaceRelationship[]> {
  await requireRoleProfileAccess(
    actorUserId,
    hostRoleType,
    hostRoleProfileId,
    "manage_collaborators",
  );

  const collaborations = await WorkplaceRelationship.find({
    hostRoleType,
    hostRoleProfileId,
    status: { $in: [...ACTIVE_INVITE_STATUSES, "suspended"] },
  })
    .populate("userId", "personalDetails.email personalDetails.firstName personalDetails.lastName")
    .sort({ createdAt: -1 })
    .lean();

  return collaborations.map((doc) =>
    toPublicWorkplaceRelationship(doc as Record<string, unknown>),
  );
}

/** @deprecated Use listCollaborators */
export const listStaff = listCollaborators;

export async function acceptInvite(
  userId: string,
  relationshipId: string,
): Promise<PublicWorkplaceRelationship> {
  const collaboration = await WorkplaceRelationship.findById(relationshipId);
  if (!collaboration) {
    throw new ApiError(404, "Workplace relationship not found", "NOT_FOUND");
  }

  if (collaboration.status !== "invited") {
    throw new ApiError(400, "Collaboration is not pending invitation", "VALIDATION_ERROR");
  }

  await assertInviteeIdentity(userId, collaboration);

  collaboration.userId = new mongoose.Types.ObjectId(userId);
  collaboration.status = "active";
  collaboration.active = true;
  collaboration.acceptedAt = new Date();
  await collaboration.save();

  await addCollaboratorToStableIndex(
    collaboration.hostRoleType as BusinessRoleType,
    String(collaboration.hostRoleProfileId),
    collaboration._id as mongoose.Types.ObjectId,
  );

  return toPublicWorkplaceRelationship(collaboration.toObject() as Record<string, unknown>);
}

export async function declineInvite(
  userId: string,
  relationshipId: string,
): Promise<PublicWorkplaceRelationship> {
  const collaboration = await WorkplaceRelationship.findById(relationshipId);
  if (!collaboration) {
    throw new ApiError(404, "Workplace relationship not found", "NOT_FOUND");
  }

  if (collaboration.status !== "invited") {
    throw new ApiError(400, "Collaboration is not pending invitation", "VALIDATION_ERROR");
  }

  await assertInviteeIdentity(userId, collaboration);

  collaboration.status = "declined";
  collaboration.active = false;
  await collaboration.save();

  return toPublicWorkplaceRelationship(collaboration.toObject() as Record<string, unknown>);
}

export async function linkInvitesByEmail(email: string, userId: string): Promise<number> {
  const normalizedEmail = email.toLowerCase().trim();

  const result = await WorkplaceRelationship.updateMany(
    {
      invitedEmail: normalizedEmail,
      status: "invited",
      $or: [{ userId: { $exists: false } }, { userId: null }],
    },
    { $set: { userId } },
  );

  return result.modifiedCount;
}

export async function updateCollaborator(
  actorUserId: string,
  hostRoleType: BusinessRoleType,
  hostRoleProfileId: string,
  relationshipId: string,
  input: UpdateCollaboratorInput,
): Promise<PublicWorkplaceRelationship> {
  await requireRoleProfileAccess(
    actorUserId,
    hostRoleType,
    hostRoleProfileId,
    "manage_collaborators",
  );

  const collaboration = await getCollaborationForProfile(
    hostRoleType,
    hostRoleProfileId,
    relationshipId,
  );

  if (!["invited", "active", "suspended"].includes(collaboration.status)) {
    throw new ApiError(400, "Cannot update this collaboration", "VALIDATION_ERROR");
  }

  if (input.hierarchyLevel !== undefined) {
    collaboration.hierarchyLevel = input.hierarchyLevel;
  }
  if (input.title !== undefined) {
    collaboration.title = input.title;
  }
  if (input.description !== undefined) {
    collaboration.description = input.description;
  }

  await collaboration.save();

  return toPublicWorkplaceRelationship(collaboration.toObject() as Record<string, unknown>);
}

/** @deprecated Use updateCollaborator */
export async function updateStaffRole(
  actorUserId: string,
  hostRoleType: BusinessRoleType,
  hostRoleProfileId: string,
  relationshipId: string,
  input: { staffRole: InviteCollaboratorInput["hierarchyLevel"] },
): Promise<PublicWorkplaceRelationship> {
  return updateCollaborator(actorUserId, hostRoleType, hostRoleProfileId, relationshipId, {
    hierarchyLevel: input.staffRole,
  });
}

export async function endCollaboration(
  actorUserId: string,
  hostRoleType: BusinessRoleType,
  hostRoleProfileId: string,
  relationshipId: string,
): Promise<PublicWorkplaceRelationship> {
  await requireRoleProfileAccess(
    actorUserId,
    hostRoleType,
    hostRoleProfileId,
    "manage_collaborators",
  );

  const collaboration = await getCollaborationForProfile(
    hostRoleType,
    hostRoleProfileId,
    relationshipId,
  );

  if (collaboration.status === "ended" || collaboration.status === "declined") {
    throw new ApiError(400, "Collaboration is already closed", "VALIDATION_ERROR");
  }

  collaboration.status = "ended";
  collaboration.active = false;
  collaboration.endedAt = new Date();
  await collaboration.save();

  await removeCollaboratorFromStableIndex(
    hostRoleType,
    hostRoleProfileId,
    collaboration._id as mongoose.Types.ObjectId,
  );

  return toPublicWorkplaceRelationship(collaboration.toObject() as Record<string, unknown>);
}

/** @deprecated Use endCollaboration */
export const revokeMembership = endCollaboration;

export async function listWorkplacesForUser(userId: string): Promise<PublicWorkplace[]> {
  const workplaces: PublicWorkplace[] = [];

  const ownedQueries = [
    { roleType: "stable" as const, model: Stable, field: "tradeName" },
    { roleType: "breeder" as const, model: Breeder, field: "operationName" },
    { roleType: "ridingClub" as const, model: RidingClub, field: "clubName" },
    { roleType: "transport" as const, model: Transport, field: "companyName" },
  ];

  for (const { roleType, model, field } of ownedQueries) {
    const owned = await model.find({ userId }).select(field).lean();
    for (const profile of owned) {
      workplaces.push({
        roleType,
        roleProfileId: String(profile._id),
        access: "owner",
        profileName: (profile as Record<string, unknown>)[field] as string | undefined,
      });
    }
  }

  const collaborations = await WorkplaceRelationship.find({
    userId,
    status: { $in: ACTIVE_INVITE_STATUSES },
  })
    .sort({ updatedAt: -1 })
    .lean();

  for (const collaboration of collaborations) {
    const roleType = collaboration.hostRoleType as BusinessRoleType;
    const relationshipId = String(collaboration._id);
    workplaces.push({
      roleType,
      roleProfileId: String(collaboration.hostRoleProfileId),
      access: "collaborator",
      hierarchyLevel: collaboration.hierarchyLevel,
      staffRole: collaboration.hierarchyLevel,
      status: collaboration.status,
      workplaceRelationshipId: relationshipId,
      membershipId: relationshipId,
      profileName: await getProfileDisplayName(roleType, String(collaboration.hostRoleProfileId)),
    });
  }

  const user = await User.findById(userId).select("personalDetails.email").lean();
  const userEmail = (user?.personalDetails as { email?: string } | undefined)?.email
    ?.toLowerCase()
    .trim();

  if (userEmail) {
    const emailInvites = await WorkplaceRelationship.find({
      invitedEmail: userEmail,
      status: "invited",
      $or: [{ userId: { $exists: false } }, { userId: null }, { userId }],
    }).lean();

    for (const collaboration of emailInvites) {
      if (collaboration.userId && String(collaboration.userId) !== userId) {
        continue;
      }

      const relationshipId = String(collaboration._id);
      const alreadyListed = workplaces.some(
        (w) =>
          w.access === "collaborator" &&
          (w.workplaceRelationshipId === relationshipId || w.membershipId === relationshipId),
      );

      if (alreadyListed) continue;

      const roleType = collaboration.hostRoleType as BusinessRoleType;
      workplaces.push({
        roleType,
        roleProfileId: String(collaboration.hostRoleProfileId),
        access: "collaborator",
        hierarchyLevel: collaboration.hierarchyLevel,
      staffRole: collaboration.hierarchyLevel,
        status: collaboration.status,
        workplaceRelationshipId: relationshipId,
        membershipId: relationshipId,
        profileName: await getProfileDisplayName(
          roleType,
          String(collaboration.hostRoleProfileId),
        ),
      });
    }
  }

  return workplaces;
}
