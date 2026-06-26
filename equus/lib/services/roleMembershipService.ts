/**
 * Role membership service — staff invites, accept/decline, and workplace listing.
 *
 * Called by REST routes under app/api/v1/role-profiles/.../staff and users/me/workplaces.
 * Workers are regular Users; access is via RoleMembership, never User.*ProfileIds.
 */

import mongoose from "mongoose";
import RoleMembership from "../../models/RoleMembership.ts";
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
import type { inviteStaffSchema, updateStaffRoleSchema } from "../validations/roleMembership.ts";

export type InviteStaffInput = z.infer<typeof inviteStaffSchema>;
export type UpdateStaffRoleInput = z.infer<typeof updateStaffRoleSchema>;

export type PublicMembershipUser = {
  id: string;
  email?: string;
  firstName?: string;
  lastName?: string;
};

export type PublicMembership = {
  id: string;
  roleType: BusinessRoleType;
  roleProfileId: string;
  staffRole: string;
  status: string;
  invitedEmail: string;
  user?: PublicMembershipUser;
  invitedByUserId: string;
  acceptedAt?: Date;
  createdAt?: Date;
  updatedAt?: Date;
};

export type PublicWorkplace = {
  roleType: BusinessRoleType;
  roleProfileId: string;
  access: "owner" | "staff";
  staffRole?: string;
  status?: string;
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

export function toPublicMembershipUser(
  doc: Record<string, unknown> | null | undefined,
): PublicMembershipUser | undefined {
  if (!doc) return undefined;

  const personalDetails = (doc.personalDetails ?? {}) as Record<string, unknown>;

  return {
    id: String(doc._id),
    email: personalDetails.email as string | undefined,
    firstName: personalDetails.firstName as string | undefined,
    lastName: personalDetails.lastName as string | undefined,
  };
}

export function toPublicMembership(doc: Record<string, unknown>): PublicMembership {
  const userDoc = doc.userId as Record<string, unknown> | undefined;
  const populatedUser =
    userDoc && typeof userDoc === "object" && userDoc._id != null ? userDoc : undefined;

  return {
    id: String(doc._id),
    roleType: doc.roleType as BusinessRoleType,
    roleProfileId: String(doc.roleProfileId),
    staffRole: String(doc.staffRole),
    status: String(doc.status),
    invitedEmail: String(doc.invitedEmail),
    user: toPublicMembershipUser(populatedUser),
    invitedByUserId: String(doc.invitedByUserId),
    acceptedAt: doc.acceptedAt as Date | undefined,
    createdAt: doc.createdAt as Date | undefined,
    updatedAt: doc.updatedAt as Date | undefined,
  };
}

// --- Internal helpers ---

async function getMembershipForProfile(
  roleType: BusinessRoleType,
  roleProfileId: string,
  membershipId: string,
) {
  if (!mongoose.Types.ObjectId.isValid(membershipId)) {
    throw new ApiError(404, "Membership not found", "NOT_FOUND");
  }

  const membership = await RoleMembership.findOne({
    _id: membershipId,
    roleType,
    roleProfileId,
  });

  if (!membership) {
    throw new ApiError(404, "Membership not found", "NOT_FOUND");
  }

  return membership;
}

async function assertInviteeIdentity(
  userId: string,
  membership: InstanceType<typeof RoleMembership>,
) {
  if (membership.userId && String(membership.userId) === userId) {
    return;
  }

  const user = await User.findById(userId).select("personalDetails.email").lean();
  const userEmail = (user?.personalDetails as { email?: string } | undefined)?.email
    ?.toLowerCase()
    .trim();

  if (userEmail && userEmail === membership.invitedEmail.toLowerCase().trim()) {
    return;
  }

  throw new ApiError(403, "You are not the invitee for this membership", "FORBIDDEN");
}

async function getProfileDisplayName(
  roleType: BusinessRoleType,
  roleProfileId: string,
): Promise<string | undefined> {
  const Model = MODEL_BY_ROLE_TYPE[roleType];
  const field = NAME_FIELD_BY_ROLE_TYPE[roleType];
  const profile = await Model.findById(roleProfileId).select(field).lean();
  if (!profile) return undefined;
  return (profile as Record<string, unknown>)[field] as string | undefined;
}

// --- Staff management ---

export async function inviteStaff(
  actorUserId: string,
  roleType: BusinessRoleType,
  roleProfileId: string,
  input: InviteStaffInput,
): Promise<PublicMembership> {
  await requireRoleProfileAccess(actorUserId, roleType, roleProfileId, "manage_staff");

  const resolved = await findBusinessRoleProfile(roleType, roleProfileId);
  if (!resolved) {
    throw new ApiError(404, "Role profile not found", "NOT_FOUND");
  }

  const normalizedEmail = input.email.toLowerCase().trim();
  const invitee = await User.findOne({ "personalDetails.email": normalizedEmail }).lean();

  if (invitee && String(invitee._id) === resolved.ownerUserId) {
    throw new ApiError(400, "Cannot invite the profile owner as staff", "VALIDATION_ERROR");
  }

  const duplicateQuery = invitee
    ? {
        roleType,
        roleProfileId,
        status: { $in: ACTIVE_INVITE_STATUSES },
        $or: [{ userId: invitee._id }, { invitedEmail: normalizedEmail }],
      }
    : {
        roleType,
        roleProfileId,
        status: { $in: ACTIVE_INVITE_STATUSES },
        invitedEmail: normalizedEmail,
      };

  const existing = await RoleMembership.findOne(duplicateQuery).lean();
  if (existing) {
    throw new ApiError(
      409,
      "This user or email already has a pending or active membership for this profile",
      "CONFLICT",
    );
  }

  const membership = await RoleMembership.create({
    roleType,
    roleProfileId,
    invitedEmail: normalizedEmail,
    ...(invitee ? { userId: invitee._id } : {}),
    staffRole: input.staffRole,
    status: "invited",
    invitedByUserId: actorUserId,
  });

  return toPublicMembership(membership.toObject() as Record<string, unknown>);
}

export async function listStaff(
  actorUserId: string,
  roleType: BusinessRoleType,
  roleProfileId: string,
): Promise<PublicMembership[]> {
  await requireRoleProfileAccess(actorUserId, roleType, roleProfileId, "manage_staff");

  const memberships = await RoleMembership.find({
    roleType,
    roleProfileId,
    status: { $in: [...ACTIVE_INVITE_STATUSES, "suspended"] },
  })
    .populate("userId", "personalDetails.email personalDetails.firstName personalDetails.lastName")
    .sort({ createdAt: -1 })
    .lean();

  return memberships.map((doc) => toPublicMembership(doc as Record<string, unknown>));
}

export async function acceptInvite(
  userId: string,
  membershipId: string,
): Promise<PublicMembership> {
  const membership = await RoleMembership.findById(membershipId);
  if (!membership) {
    throw new ApiError(404, "Membership not found", "NOT_FOUND");
  }

  if (membership.status !== "invited") {
    throw new ApiError(400, "Membership is not pending invitation", "VALIDATION_ERROR");
  }

  await assertInviteeIdentity(userId, membership);

  membership.userId = new mongoose.Types.ObjectId(userId);
  membership.status = "active";
  membership.acceptedAt = new Date();
  await membership.save();

  return toPublicMembership(membership.toObject() as Record<string, unknown>);
}

export async function declineInvite(
  userId: string,
  membershipId: string,
): Promise<PublicMembership> {
  const membership = await RoleMembership.findById(membershipId);
  if (!membership) {
    throw new ApiError(404, "Membership not found", "NOT_FOUND");
  }

  if (membership.status !== "invited") {
    throw new ApiError(400, "Membership is not pending invitation", "VALIDATION_ERROR");
  }

  await assertInviteeIdentity(userId, membership);

  membership.status = "declined";
  await membership.save();

  return toPublicMembership(membership.toObject() as Record<string, unknown>);
}

export async function linkInvitesByEmail(email: string, userId: string): Promise<number> {
  const normalizedEmail = email.toLowerCase().trim();

  const result = await RoleMembership.updateMany(
    {
      invitedEmail: normalizedEmail,
      status: "invited",
      $or: [{ userId: { $exists: false } }, { userId: null }],
    },
    { $set: { userId } },
  );

  return result.modifiedCount;
}

export async function updateStaffRole(
  actorUserId: string,
  roleType: BusinessRoleType,
  roleProfileId: string,
  membershipId: string,
  input: UpdateStaffRoleInput,
): Promise<PublicMembership> {
  await requireRoleProfileAccess(actorUserId, roleType, roleProfileId, "manage_staff");

  const membership = await getMembershipForProfile(roleType, roleProfileId, membershipId);

  if (!["invited", "active", "suspended"].includes(membership.status)) {
    throw new ApiError(400, "Cannot update role for this membership", "VALIDATION_ERROR");
  }

  membership.staffRole = input.staffRole;
  await membership.save();

  return toPublicMembership(membership.toObject() as Record<string, unknown>);
}

export async function revokeMembership(
  actorUserId: string,
  roleType: BusinessRoleType,
  roleProfileId: string,
  membershipId: string,
): Promise<PublicMembership> {
  await requireRoleProfileAccess(actorUserId, roleType, roleProfileId, "manage_staff");

  const membership = await getMembershipForProfile(roleType, roleProfileId, membershipId);

  if (membership.status === "removed" || membership.status === "declined") {
    throw new ApiError(400, "Membership is already closed", "VALIDATION_ERROR");
  }

  membership.status = "removed";
  await membership.save();

  return toPublicMembership(membership.toObject() as Record<string, unknown>);
}

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

  const memberships = await RoleMembership.find({
    userId,
    status: { $in: ACTIVE_INVITE_STATUSES },
  })
    .sort({ updatedAt: -1 })
    .lean();

  for (const membership of memberships) {
    const roleType = membership.roleType as BusinessRoleType;
    workplaces.push({
      roleType,
      roleProfileId: String(membership.roleProfileId),
      access: "staff",
      staffRole: membership.staffRole,
      status: membership.status,
      membershipId: String(membership._id),
      profileName: await getProfileDisplayName(roleType, String(membership.roleProfileId)),
    });
  }

  const user = await User.findById(userId).select("personalDetails.email").lean();
  const userEmail = (user?.personalDetails as { email?: string } | undefined)?.email
    ?.toLowerCase()
    .trim();

  if (userEmail) {
    const emailInvites = await RoleMembership.find({
      invitedEmail: userEmail,
      status: "invited",
      $or: [{ userId: { $exists: false } }, { userId: null }, { userId }],
    }).lean();

    for (const membership of emailInvites) {
      if (membership.userId && String(membership.userId) !== userId) {
        continue;
      }

      const alreadyListed = workplaces.some(
        (w) =>
          w.access === "staff" &&
          w.membershipId === String(membership._id),
      );

      if (alreadyListed) continue;

      const roleType = membership.roleType as BusinessRoleType;
      workplaces.push({
        roleType,
        roleProfileId: String(membership.roleProfileId),
        access: "staff",
        staffRole: membership.staffRole,
        status: membership.status,
        membershipId: String(membership._id),
        profileName: await getProfileDisplayName(roleType, String(membership.roleProfileId)),
      });
    }
  }

  return workplaces;
}
