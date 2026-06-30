/**
 * Rider model — position-linked role profile for users who ride professionally.
 *
 * One Rider per User (`User.riderProfileId`). Called by future role-profile APIs.
 * Horse access is via `Relationship` (direct) or barn collaboration on hosted horses.
 */

import mongoose, { Schema, model } from "mongoose";
import { addressSchema } from "./sharedSchemas/address.ts";
import {
  mediaAssetSchema,
  ratingSummarySchema,
  verificationProfileSchema,
} from "./sharedSchemas/index.ts";
import * as enums from "../utils/enums.ts";

const { horseDisciplineEnums } = enums;

const riderSchema = new Schema(
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

    disciplines: { type: [String], enum: horseDisciplineEnums, default: undefined },
    experienceYears: { type: Number, min: 0 },
    competitionHighlights: { type: [String], default: undefined },

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

riderSchema.index({ displayName: 1 });

const Rider = mongoose.models.Rider || model("Rider", riderSchema);
export default Rider;
