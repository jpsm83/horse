/**
 * Groom model — position-linked role profile for users who provide grooming services.
 *
 * One Groom per User (`User.groomProfileId`). Barn work uses `WorkplaceRelationship`;
 * direct owner requests use horse `Relationship` (type groom).
 */

import mongoose, { Schema, model } from "mongoose";
import { addressSchema } from "./sharedSchemas/address.ts";
import {
  mediaAssetSchema,
  ratingSummarySchema,
  verificationProfileSchema,
} from "./sharedSchemas/index.ts";

const groomSchema = new Schema(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: [true, "User id is required!"],
      index: true,
    },

    displayName: { type: String, required: [true, "Display name is required!"] },
    bio: { type: String },
    email: { type: String, required: [true, "Email is required!"], lowercase: true },
    phoneNumber: { type: String },
    address: { type: addressSchema },
    imageUrl: { type: String },
    gallery: { type: [mediaAssetSchema], default: undefined },

    experienceYears: { type: Number, min: 0 },
    specialties: { type: [String], default: undefined },

    verification: { type: verificationProfileSchema, default: () => ({}) },
    ratingSummary: { type: ratingSummarySchema, default: () => ({}) },
    acceptsNewClients: { type: Boolean, default: true },

    lastActiveAt: { type: Date },
    isActive: { type: Boolean, default: true },
    isPublic: { type: Boolean, default: true },
  },
  {
    timestamps: true,
    trim: true,
  },
);

groomSchema.index({ displayName: 1 });

const Groom = mongoose.models.Groom || model("Groom", groomSchema);
export default Groom;
