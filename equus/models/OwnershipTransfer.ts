/**
 * OwnershipTransfer — consent-based changes to entity `mainOwnerUserId` and `coOwners[]`.
 *
 * Pending state lives here (not on the entity). Applies on accept via ownershipTransferService.
 * Eligible entities: Horse, Stable, Breeder, Transport, RidingClub only.
 *
 * Lifecycle: status-driven — never hard-delete. See `documentation/ownershipTransfer.md`.
 */

import mongoose, { Schema, model } from "mongoose";
import * as enums from "../utils/enums.ts";

const {
  ownershipTransferEntityTypeEnums,
  ownershipTransferKindEnums,
  ownershipTransferStatusEnums,
} = enums;

const ownershipTransferSchema = new Schema(
  {
    entityType: {
      type: String,
      enum: ownershipTransferEntityTypeEnums,
      required: [true, "Entity type is required!"],
      index: true,
    },

    entityId: {
      type: Schema.Types.ObjectId,
      required: [true, "Entity id is required!"],
      index: true,
    },

    transferKind: {
      type: String,
      enum: ownershipTransferKindEnums,
      required: [true, "Transfer kind is required!"],
      index: true,
    },

    status: {
      type: String,
      enum: ownershipTransferStatusEnums,
      default: "pending",
      index: true,
    },

    initiatorUserId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: [true, "Initiator user id is required!"],
      index: true,
    },

    /** Registered receiver (new main owner or responding co-owner). */
    receiverUserId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      default: undefined,
      index: true,
    },

    /** Co-owner subject for `remove_co_owner` and `promote_co_owner`. */
    targetCoOwnerUserId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      default: undefined,
      index: true,
    },

    /** Pre-signup invite path (primarily `transfer_main`). */
    invitedEmail: { type: String, lowercase: true, trim: true },
    invitedName: { type: String, trim: true },
    referralReference: { type: String, index: true, sparse: true },

    requestedAt: { type: Date, default: Date.now },
    respondedAt: { type: Date },

    historicalReference: {
      entityName: { type: String },
      initiatorLabel: { type: String },
      receiverLabel: { type: String },
      targetCoOwnerLabel: { type: String },
    },

    requestMessage: { type: String },
    responseMessage: { type: String },
  },
  {
    timestamps: true,
    trim: true,
  },
);

ownershipTransferSchema.index({ entityType: 1, entityId: 1, status: 1 });
ownershipTransferSchema.index({ receiverUserId: 1, status: 1 });
ownershipTransferSchema.index({ initiatorUserId: 1, status: 1 });

const OwnershipTransfer =
  mongoose.models.OwnershipTransfer ||
  model("OwnershipTransfer", ownershipTransferSchema);

export default OwnershipTransfer;
