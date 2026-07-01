import mongoose, { Schema, model } from "mongoose";
import { addressSchema } from "./sharedSchemas/address.ts";
import {
  deactivationAuditFields,
  mediaAssetSchema,
  ratingSummarySchema,
  serviceOfferingSchema,
  verificationProfileSchema,
  weeklyAvailabilitySchema,
} from "./sharedSchemas/index.ts";
import * as enums from "../utils/enums.ts";

const { currencyEnums } = enums;

const veterinarySpecializationSchema = new Schema(
  {
    name: { type: String, required: true }, // lameness, dentistry, reproduction, etc.
    description: { type: String },
  },
  { _id: false }
);

const veterinarySchema = new Schema(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: [true, "User id is required!"],
      index: true,
    },

    /** Practice identity */
    practiceName: { type: String, required: [true, "Practice name is required!"] },
    legalName: { type: String },
    description: { type: String, required: [true, "Description is required!"] },
    email: { type: String, required: [true, "Email is required!"], lowercase: true },
    phoneNumber: { type: String, required: [true, "Phone number is required!"] },
    emergencyPhoneNumber: { type: String },
    address: { type: addressSchema, required: [true, "Address is required!"] },
    imageUrl: { type: String },
    gallery: { type: [mediaAssetSchema], default: undefined },

    /** Veterinary-specific */
    equineSpecializations: {
      type: [veterinarySpecializationSchema],
      default: undefined,
    },
    certifications: { type: [String], default: undefined },
    licenseNumber: { type: String },
    emergencyAvailability: { type: Boolean, default: false },
    emergencyCoverageNotes: { type: String },
    serviceAreaKm: { type: Number, min: 0 },
    consultationFeeFrom: { type: Number, min: 0 },
    currency: { type: String, enum: currencyEnums, default: "USD" },
    serviceOfferings: { type: [serviceOfferingSchema], default: undefined },
    weeklyAvailability: { type: [weeklyAvailabilitySchema], default: undefined },

    /** Trust and discovery */
    verification: { type: verificationProfileSchema, default: () => ({}) },
    ratingSummary: { type: ratingSummarySchema, default: () => ({}) },
    acceptsNewPatients: { type: Boolean, default: true },

    /** Partner program */
    referralCode: { type: String, index: true, sparse: true },
    commissionEligible: { type: Boolean, default: true },

    lastActiveAt: { type: Date },
    ...deactivationAuditFields,
    isPublic: { type: Boolean, default: true },
  },
  {
    timestamps: true,
    trim: true,
  }
);

veterinarySchema.index({ practiceName: 1 });
veterinarySchema.index({ emergencyAvailability: 1 });
veterinarySchema.index({ "address.city": 1, "address.country": 1 });

const Veterinary =
  mongoose.models.Veterinary || model("Veterinary", veterinarySchema);
export default Veterinary;
