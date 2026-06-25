import { Schema } from "mongoose";

/** Shared media asset (photo/video) used on profiles and horse records */
export const mediaAssetSchema = new Schema(
  {
    url: { type: String, required: [true, "Media URL is required!"] },
    publicId: { type: String }, // cloud storage id (e.g. Cloudinary)
    type: { type: String, enum: ["image", "video", "voice", "document"], default: "image" },
    caption: { type: String },
    uploadedByUserId: { type: Schema.Types.ObjectId, ref: "User" },
    uploadedAt: { type: Date, default: Date.now },
  },
  { _id: true }
);
