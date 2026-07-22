import mongoose, { Schema, model } from "mongoose";
import { deactivationAuditFields } from "./sharedSchemas/deactivationAudit.ts";

const documentDeletionRequestStatusEnums = [
  "pending",
  "approved",
  "declined",
  "cancelled",
] as const;

const documentDeletionRequestSchema = new Schema(
  {
    horseId: {
      type: Schema.Types.ObjectId,
      ref: "Horse",
      required: true,
      index: true,
    },
    documentId: {
      type: Schema.Types.ObjectId,
      ref: "Document",
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
      enum: documentDeletionRequestStatusEnums,
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

documentDeletionRequestSchema.index({ horseId: 1, status: 1 });

const DocumentDeletionRequest =
  mongoose.models.DocumentDeletionRequest ||
  model("DocumentDeletionRequest", documentDeletionRequestSchema);
export default DocumentDeletionRequest;
