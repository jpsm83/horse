/**
 * RoleMembership — staff access to business role profiles (stable, breeder, etc.).
 *
 * Workers are regular Users linked here; they are never added to User.*ProfileIds.
 * Called by `roleMembershipService` and `requireRoleProfileAccess`.
 */

import mongoose, { Schema, model } from "mongoose";
import * as enums from "../utils/enums.ts";

const { businessRoleTypeEnums, roleStaffLevelEnums, roleMembershipStatusEnums } = enums;

const roleMembershipSchema = new Schema(
  {
    roleType: {
      type: String,
      enum: businessRoleTypeEnums,
      required: [true, "Role type is required!"],
      index: true,
    },

    roleProfileId: {
      type: Schema.Types.ObjectId,
      required: [true, "Role profile id is required!"],
      index: true,
    },

    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      default: undefined,
      index: true,
    },

    invitedEmail: {
      type: String,
      required: [true, "Invited email is required!"],
      lowercase: true,
      trim: true,
    },

    staffRole: {
      type: String,
      enum: roleStaffLevelEnums,
      required: [true, "Staff role is required!"],
    },

    status: {
      type: String,
      enum: roleMembershipStatusEnums,
      default: "invited",
      index: true,
    },

    invitedByUserId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: [true, "Invited by user id is required!"],
    },

    acceptedAt: { type: Date, default: undefined },
  },
  {
    timestamps: true,
    trim: true,
  },
);

roleMembershipSchema.index({ roleType: 1, roleProfileId: 1, status: 1 });
roleMembershipSchema.index({ userId: 1, status: 1 });
roleMembershipSchema.index({ invitedEmail: 1, status: 1 });

roleMembershipSchema.index(
  { roleType: 1, roleProfileId: 1, userId: 1 },
  {
    unique: true,
    partialFilterExpression: {
      status: { $in: ["invited", "active"] },
      userId: { $exists: true, $type: "objectId" },
    },
  },
);

roleMembershipSchema.index(
  { roleType: 1, roleProfileId: 1, invitedEmail: 1 },
  {
    unique: true,
    partialFilterExpression: {
      status: "invited",
      userId: { $exists: false },
    },
  },
);

const RoleMembership =
  mongoose.models.RoleMembership || model("RoleMembership", roleMembershipSchema);
export default RoleMembership;
