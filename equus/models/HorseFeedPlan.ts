/**
 * HorseFeedPlan — feed schedules attributed to source entities.
 *
 * Each plan entry represents a meal or supplement scheduled for the horse.
 * Source attribution allows stables, vets, or owners to manage feed.
 */

import mongoose, { Schema, model } from "mongoose";
import { deactivationAuditFields } from "./sharedSchemas/deactivationAudit.ts";
import * as enums from "../utils/enums.ts";

const { accountTypeEnums } = enums;

const horseFeedPlanSchema = new Schema(
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

    mealTime: {
      type: String,
      enum: ["morning", "afternoon", "evening", "night"],
      required: true,
    },
    feedType: { type: String, required: true },
    quantity: { type: String },
    unit: { type: String, default: "kg" },
    supplements: [{
      name: { type: String },
      quantity: { type: String },
      unit: { type: String },
    }],
    notes: { type: String },
    scheduleDays: [{ type: String, enum: ["mon","tue","wed","thu","fri","sat","sun"] }],

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

horseFeedPlanSchema.index({ horseId: 1, mealTime: 1 });
horseFeedPlanSchema.index({ sourceEntityId: 1, sourceEntityType: 1 });

const HorseFeedPlan =
  mongoose.models.HorseFeedPlan || model("HorseFeedPlan", horseFeedPlanSchema);
export default HorseFeedPlan;
