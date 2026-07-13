import mongoose, { Schema, model } from "mongoose";
import { deactivationAuditFields } from "./sharedSchemas/deactivationAudit.ts";

const horseEventSchema = new Schema(
  {
    horseId: { type: Schema.Types.ObjectId, ref: "Horse", required: true, index: true },
    sourceEntityType: { type: String },
    sourceEntityId: { type: Schema.Types.ObjectId },
    createdByUserId: { type: Schema.Types.ObjectId, ref: "User", required: true },

    eventType: {
      type: String,
      enum: ["appointment", "competition", "training", "feeding", "other"],
      required: true,
    },
    title: { type: String, required: true },
    description: { type: String },
    startDate: { type: Date, required: true, index: true },
    endDate: { type: Date },
    allDay: { type: Boolean, default: false },
    location: { type: String },

    visibilityMode: {
      type: String,
      enum: ["owner", "entities", "public"],
      default: "entities",
    },
    visibilityEntityIds: [{ type: Schema.Types.ObjectId }],

    ...deactivationAuditFields,
  },
  { timestamps: true },
);

horseEventSchema.index({ horseId: 1, startDate: -1 });

const HorseEvent = mongoose.models.HorseEvent || model("HorseEvent", horseEventSchema);
export default HorseEvent;
