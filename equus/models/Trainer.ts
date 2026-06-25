import mongoose, { Schema, model } from "mongoose";
import { addressSchema } from "./sharedSchemas/address.ts";
import {
  mediaAssetSchema,
  ratingSummarySchema,
  serviceOfferingSchema,
  verificationProfileSchema,
  weeklyAvailabilitySchema,
} from "./sharedSchemas/index.ts";
import * as enums from "../packages/enums.ts";

const { horseDisciplineEnums, currencyEnums } = enums;

const certificationSchema = new Schema(
  {
    name: { type: String, required: true },
    issuer: { type: String },
    issuedAt: { type: Date },
    expiresAt: { type: Date },
    documentUrl: { type: String },
  },
  { _id: true }
);

const trainerSchema = new Schema(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: [true, "User id is required!"],
      index: true,
    },

    /** Identity */
    displayName: { type: String, required: [true, "Display name is required!"] },
    legalName: { type: String },
    bio: { type: String, required: [true, "Bio is required!"] },
    email: { type: String, required: [true, "Email is required!"], lowercase: true },
    phoneNumber: { type: String, required: [true, "Phone number is required!"] },
    address: { type: addressSchema, required: [true, "Address is required!"] },
    imageUrl: { type: String },
    gallery: { type: [mediaAssetSchema], default: undefined },

    /** Trainer-specific */
    specialties: { type: [String], enum: horseDisciplineEnums, default: undefined },
    experienceYears: { type: Number, min: 0 },
    certifications: { type: [certificationSchema], default: undefined },
    competitionHighlights: { type: [String], default: undefined },
    serviceAreaKm: { type: Number, min: 0 },
    serviceOfferings: { type: [serviceOfferingSchema], default: undefined },
    sessionRateFrom: { type: Number, min: 0 },
    sessionRateTo: { type: Number, min: 0 },
    currency: { type: String, enum: currencyEnums, default: "USD" },
    weeklyAvailability: { type: [weeklyAvailabilitySchema], default: undefined },

    /** Linked stables where trainer works */
    linkedStableIds: {
      type: [{ type: Schema.Types.ObjectId, ref: "Stable" }],
      default: undefined,
    },

    /** Trust and discovery */
    verification: { type: verificationProfileSchema, default: () => ({}) },
    ratingSummary: { type: ratingSummarySchema, default: () => ({}) },
    acceptsNewClients: { type: Boolean, default: true },

    /** Partner program */
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

trainerSchema.index({ displayName: 1 });
trainerSchema.index({ specialties: 1 });
trainerSchema.index({ "address.city": 1, "address.country": 1 });

const Trainer = mongoose.models.Trainer || model("Trainer", trainerSchema);
export default Trainer;
