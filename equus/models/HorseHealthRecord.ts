/**
 * HorseHealthRecord — medical records attributed to source entities.
 *
 * Each record is keyed by `horseId` with `sourceEntityType`/`sourceEntityId`
 * to attribute it to the creating entity (vet, stable, owner).
 *
 * Option C pattern: horse-keyed collection, entity-attributed.
 */

import mongoose, { Schema, model } from "mongoose";
import { deactivationAuditFields } from "./sharedSchemas/deactivationAudit.ts";
import * as enums from "../utils/enums.ts";

const { accountTypeEnums } = enums;

const horseHealthRecordSchema = new Schema(
  {
    horseId: {
      type: Schema.Types.ObjectId,
      ref: "Horse",
      required: true,
      index: true,
    },
    sourceEntityType: { type: String, enum: accountTypeEnums },
    sourceEntityId: { type: Schema.Types.ObjectId },
    createdByUserId: { type: Schema.Types.ObjectId, ref: "User", required: true },

    recordType: {
      type: String,
      enum: ["vaccination", "exam", "medication", "injury", "allergy", "other"],
      required: true,
    },
    title: { type: String, required: true },
    description: { type: String },
    date: { type: Date, required: true },
    performedBy: { type: String },
    notes: { type: String },

    visibilityMode: {
      type: String,
      enum: ["owner", "entities", "public"],
      default: "owner",
    },
    visibilityEntityIds: [{ type: Schema.Types.ObjectId }],

    ...deactivationAuditFields,
  },
  { timestamps: true },
);

horseHealthRecordSchema.index({ horseId: 1, date: -1 });
horseHealthRecordSchema.index({ sourceEntityId: 1, sourceEntityType: 1 });

const HorseHealthRecord =
  mongoose.models.HorseHealthRecord || model("HorseHealthRecord", horseHealthRecordSchema);
export default HorseHealthRecord;
