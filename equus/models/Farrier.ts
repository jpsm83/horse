/**
 * Farrier model — position-linked role profile for hoof-care providers.
 *
 * One Farrier per User (`User.farrierProfileId`). Horse access via direct `Relationship`
 * or barn path (collaboration + stable hosts horse).
 */

import mongoose, { Schema, model } from "mongoose";
import { addressSchema } from "./sharedSchemas/address.ts";
import {
  mediaAssetSchema,
  ratingSummarySchema,
  verificationProfileSchema,
  weeklyAvailabilitySchema,
} from "./sharedSchemas/index.ts";

const farrierSchema = new Schema(
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
    serviceAreaKm: { type: Number, min: 0 },
    weeklyAvailability: { type: [weeklyAvailabilitySchema], default: undefined },

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

farrierSchema.index({ displayName: 1 });

const Farrier = mongoose.models.Farrier || model("Farrier", farrierSchema);
export default Farrier;
