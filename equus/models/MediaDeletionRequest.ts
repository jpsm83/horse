import mongoose, { Schema, model } from "mongoose";
import { deactivationAuditFields } from "./sharedSchemas/deactivationAudit.ts";

const mediaDeletionRequestStatusEnums = [
  "pending",
  "approved",
  "declined",
  "cancelled",
] as const;

const mediaDeletionRequestSchema = new Schema(
  {
    horseId: {
      type: Schema.Types.ObjectId,
      ref: "Horse",
      required: true,
      index: true,
    },
    mediaId: {
      type: Schema.Types.ObjectId,
      ref: "Media",
      required: true,
    },
    requesterUserId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    decisionByUserId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      default: undefined,
    },
    status: {
      type: String,
      enum: mediaDeletionRequestStatusEnums,
      default: "pending",
    },
    requestMessage: { type: String, default: undefined },
    responseMessage: { type: String, default: undefined },
    requestedAt: { type: Date, default: Date.now },
    respondedAt: { type: Date, default: undefined },
    appliedAt: { type: Date, default: undefined },
    ...deactivationAuditFields,
  },
  { timestamps: true },
);

mediaDeletionRequestSchema.index({ horseId: 1, status: 1 });

const MediaDeletionRequest =
  mongoose.models.MediaDeletionRequest ||
  model("MediaDeletionRequest", mediaDeletionRequestSchema);
export default MediaDeletionRequest;
