import mongoose, { Schema, model } from "mongoose";
import * as enums from "../packages/enums.ts";

const { documentTypeEnums, visibilityEnums, accountTypeEnums } = enums;

const documentSchema = new Schema(
  {
    horseId: { type: Schema.Types.ObjectId, ref: "Horse", index: true },
    ownerUserId: { type: Schema.Types.ObjectId, ref: "User", index: true },

    uploadedByUserId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: [true, "Uploader user id is required!"],
      index: true,
    },
    uploaderAccountType: { type: String, enum: accountTypeEnums },
    uploaderAccountId: { type: Schema.Types.ObjectId },

    documentType: {
      type: String,
      enum: documentTypeEnums,
      required: [true, "Document type is required!"],
    },
    title: { type: String, required: [true, "Document title is required!"] },
    description: { type: String },

    fileUrl: { type: String, required: [true, "File URL is required!"] },
    fileName: { type: String, required: [true, "File name is required!"] },
    mimeType: { type: String },
    fileSizeBytes: { type: Number, min: 0 },
    storagePublicId: { type: String },

    visibility: {
      type: String,
      enum: visibilityEnums,
      default: "relationship",
    },

    relationshipId: { type: Schema.Types.ObjectId, ref: "Relationship" },
    invoiceId: { type: Schema.Types.ObjectId, ref: "Invoice" },

    issuedAt: { type: Date },
    expiresAt: { type: Date },
    isArchived: { type: Boolean, default: false },
  },
  {
    timestamps: true,
    trim: true,
  }
);

documentSchema.index({ horseId: 1, documentType: 1 });
documentSchema.index({ ownerUserId: 1, visibility: 1 });

const Document = mongoose.models.Document || model("Document", documentSchema);
export default Document;
