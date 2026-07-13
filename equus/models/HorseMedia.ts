import mongoose, { Schema, model } from "mongoose";
import { deactivationAuditFields } from "./sharedSchemas/deactivationAudit.ts";
import * as enums from "../utils/enums.ts";

const { accountTypeEnums } = enums;

const horseMediaSchema = new Schema(
  {
    horseId: { type: Schema.Types.ObjectId, ref: "Horse", required: true, index: true },
    sourceEntityType: { type: String, enum: accountTypeEnums },
    sourceEntityId: { type: Schema.Types.ObjectId },
    uploadedByUserId: { type: Schema.Types.ObjectId, ref: "User", required: true },

    type: { type: String, enum: ["image", "video", "other"], required: true },
    url: { type: String, required: true },
    thumbnailUrl: { type: String },
    title: { type: String },
    description: { type: String },
    fileSizeBytes: { type: Number },
    mimeType: { type: String },

    visibilityMode: {
      type: String,
      enum: ["owner", "entities", "public"],
      default: "owner",
    },
    visibilityOverriddenByOwner: { type: Boolean, default: false },
    visibilityEntityIds: [{ type: Schema.Types.ObjectId }],

    ...deactivationAuditFields,
  },
  { timestamps: true },
);

horseMediaSchema.index({ horseId: 1, createdAt: -1 });
horseMediaSchema.index({ sourceEntityId: 1, sourceEntityType: 1 });

const HorseMedia = mongoose.models.HorseMedia || model("HorseMedia", horseMediaSchema);
export default HorseMedia;
