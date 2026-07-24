/**
 * PedigreeConnection — consent for linking a child horse's sire/dam.
 *
 * Acknowledgment only: on accept, writes Horse.pedigree.sire*|dam* on the child.
 * Never changes ownership on either horse.
 */

import mongoose, { Schema, model } from "mongoose";
import * as enums from "../utils/enums.ts";

const { pedigreeConnectionRoleEnums, pedigreeConnectionStatusEnums } = enums;

const pedigreeConnectionSchema = new Schema(
  {
    childHorseId: {
      type: Schema.Types.ObjectId,
      ref: "Horse",
      required: [true, "Child horse id is required!"],
      index: true,
    },

    role: {
      type: String,
      enum: pedigreeConnectionRoleEnums,
      required: [true, "Pedigree role is required!"],
      index: true,
    },

    status: {
      type: String,
      enum: pedigreeConnectionStatusEnums,
      default: "pending",
      index: true,
    },

    initiatorUserId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: [true, "Initiator user id is required!"],
      index: true,
    },

    receiverUserId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      default: undefined,
      index: true,
    },

    invitedEmail: { type: String, lowercase: true, trim: true },
    invitedName: { type: String, trim: true },
    referralReference: { type: String, index: true, sparse: true },

    /** Existing Equus parent horse (search path). */
    parentHorseId: { type: Schema.Types.ObjectId, ref: "Horse" },
    /** Parent display name (invite path and snapshots). */
    parentHorseName: { type: String, trim: true },
    /** Identity for parent horse created on accept (invite path). */
    parentRegistryId: { type: String },
    parentMicrochipId: { type: String },
    parentPassportNumber: { type: String },

    requestedAt: { type: Date, default: Date.now },
    respondedAt: { type: Date },

    historicalReference: {
      childHorseName: { type: String },
      initiatorLabel: { type: String },
      receiverLabel: { type: String },
      parentHorseName: { type: String },
      role: { type: String },
    },
  },
  {
    timestamps: true,
    trim: true,
  },
);

pedigreeConnectionSchema.index({ childHorseId: 1, role: 1, status: 1 });
pedigreeConnectionSchema.index({ receiverUserId: 1, status: 1 });
pedigreeConnectionSchema.index({ invitedEmail: 1, status: 1 });

const PedigreeConnection =
  mongoose.models.PedigreeConnection ||
  model("PedigreeConnection", pedigreeConnectionSchema);

export default PedigreeConnection;
