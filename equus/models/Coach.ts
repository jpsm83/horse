import mongoose, { Schema, model } from "mongoose";
import { addressSchema } from "./sharedSchemas/address.ts";
import {
  mediaAssetSchema,
  ratingSummarySchema,
  serviceOfferingSchema,
  verificationProfileSchema,
  weeklyAvailabilitySchema,
} from "./sharedSchemas/index.ts";
import * as enums from "../utils/enums.ts";

const { horseDisciplineEnums, currencyEnums } = enums;

const coachSchema = new Schema(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: [true, "User id is required!"],
      index: true,
    },

    /** Identity */
    displayName: { type: String, required: [true, "Display name is required!"] },
    bio: { type: String, required: [true, "Bio is required!"] },
    email: { type: String, required: [true, "Email is required!"], lowercase: true },
    phoneNumber: { type: String, required: [true, "Phone number is required!"] },
    address: { type: addressSchema, required: [true, "Address is required!"] },
    imageUrl: { type: String },
    gallery: { type: [mediaAssetSchema], default: undefined },

    /** Coach-specific */
    disciplines: { type: [String], enum: horseDisciplineEnums, default: undefined },
    competitionLevels: { type: [String], default: undefined }, // national, international, etc.
    preparationServices: { type: [String], default: undefined },
    experienceYears: { type: Number, min: 0 },
    serviceOfferings: { type: [serviceOfferingSchema], default: undefined },
    sessionRateFrom: { type: Number, min: 0 },
    sessionRateTo: { type: Number, min: 0 },
    currency: { type: String, enum: currencyEnums, default: "USD" },
    weeklyAvailability: { type: [weeklyAvailabilitySchema], default: undefined },

    /** Trust and discovery */
    verification: { type: verificationProfileSchema, default: () => ({}) },
    ratingSummary: { type: ratingSummarySchema, default: () => ({}) },
    acceptsNewClients: { type: Boolean, default: true },

    referralCode: { type: String, index: true, sparse: true },
    commissionEligible: { type: Boolean, default: true },

    lastActiveAt: { type: Date },
    isActive: { type: Boolean, default: true },
    isPublic: { type: Boolean, default: true },
  },
  {
    timestamps: true,
    trim: true,
  }
);

coachSchema.index({ displayName: 1 });
coachSchema.index({ disciplines: 1 });

const Coach = mongoose.models.Coach || model("Coach", coachSchema);
export default Coach;
