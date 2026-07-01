/**
 * WorkplaceRelationship — stable collaboration link (User ↔ host role profile).
 *
 * Canonical collaboration document; `Stable.collaborators[]` is a denormalized index
 * of active collaboration ids. Called by workplaceRelationshipService and REST routes.
 *
 * Lifecycle: use `status` + `endedAt` — never hard-delete except invite-email rollback.
 * See `documentation/dataLifecycle.md`.
 */

import mongoose, { Schema, model } from "mongoose";
import * as enums from "../utils/enums.ts";

const {
  businessRoleTypeEnums,
  workplaceHierarchyLevelEnums,
  workplaceRelationshipStatusEnums,
} = enums;

const workplaceRelationshipSchema = new Schema(
  {
    hostRoleType: {
      type: String,
      enum: businessRoleTypeEnums,
      required: [true, "Host role type is required!"],
      index: true,
    },

    hostRoleProfileId: {
      type: Schema.Types.ObjectId,
      required: [true, "Host role profile id is required!"],
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

    hierarchyLevel: {
      type: String,
      enum: workplaceHierarchyLevelEnums,
      required: [true, "Hierarchy level is required!"],
    },

    status: {
      type: String,
      enum: workplaceRelationshipStatusEnums,
      default: "invited",
      index: true,
    },

    active: {
      type: Boolean,
      default: false,
    },

    title: { type: String, default: undefined },
    description: { type: String, default: undefined },

    invitedByUserId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: [true, "Invited by user id is required!"],
    },

    acceptedAt: { type: Date, default: undefined },
    endedAt: { type: Date, default: undefined },
    endedReason: { type: String, default: undefined },
  },
  {
    timestamps: true,
    trim: true,
  },
);

workplaceRelationshipSchema.index({ hostRoleType: 1, hostRoleProfileId: 1, status: 1 });
workplaceRelationshipSchema.index({ userId: 1, status: 1 });
workplaceRelationshipSchema.index({ invitedEmail: 1, status: 1 });

workplaceRelationshipSchema.index(
  { hostRoleType: 1, hostRoleProfileId: 1, userId: 1 },
  {
    unique: true,
    partialFilterExpression: {
      status: { $in: ["invited", "active"] },
      userId: { $exists: true, $type: "objectId" },
    },
  },
);

workplaceRelationshipSchema.index(
  { hostRoleType: 1, hostRoleProfileId: 1, invitedEmail: 1 },
  {
    unique: true,
    partialFilterExpression: {
      status: "invited",
      userId: { $exists: false },
    },
  },
);

const WorkplaceRelationship =
  mongoose.models.WorkplaceRelationship ||
  model("WorkplaceRelationship", workplaceRelationshipSchema);
export default WorkplaceRelationship;
