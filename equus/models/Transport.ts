import mongoose, { Schema, model } from "mongoose";
import { addressSchema } from "./sharedSchemas/address.ts";
import {
  coOwnerSchema,
  deactivationAuditFields,
  mediaAssetSchema,
  ratingSummarySchema,
  serviceOfferingSchema,
  verificationProfileSchema,
  weeklyAvailabilitySchema,
} from "./sharedSchemas/index.ts";
import * as enums from "../utils/enums.ts";

const { transportSpecialtyEnums, currencyEnums } = enums;

const fleetVehicleSchema = new Schema(
  {
    label: { type: String, required: true },
    capacityHorses: { type: Number, min: 1, required: true },
    hasClimateControl: { type: Boolean, default: false },
    licensePlate: { type: String },
    notes: { type: String },
    isActive: { type: Boolean, default: true },
  },
  { _id: true }
);

const coverageRouteSchema = new Schema(
  {
    originRegion: { type: String, required: true },
    destinationRegion: { type: String, required: true },
    estimatedDistanceKm: { type: Number, min: 0 },
    basePrice: { type: Number, min: 0 },
    currency: { type: String, enum: currencyEnums, default: "USD" },
    isActive: { type: Boolean, default: true },
  },
  { _id: true }
);

const transportSchema = new Schema(
  {
    /** Ownership — main operator plus optional partners (same pattern as Stable) */
    mainOwnerUserId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: [true, "Main owner user id is required!"],
      index: true,
    },
    coOwners: { type: [coOwnerSchema], default: undefined },

    /** Company identity */
    companyName: { type: String, required: [true, "Company name is required!"] },
    legalName: { type: String },
    description: { type: String, required: [true, "Description is required!"] },
    email: { type: String, required: [true, "Email is required!"], lowercase: true },
    phoneNumber: { type: String, required: [true, "Phone number is required!"] },
    emergencyPhoneNumber: { type: String },
    websiteUrl: { type: String },
    address: { type: addressSchema, required: [true, "Address is required!"] },
    imageUrl: { type: String },
    gallery: { type: [mediaAssetSchema], default: undefined },

    /** Transport-specific */
    specialties: { type: [String], enum: transportSpecialtyEnums, default: undefined },
    serviceAreas: { type: [String], default: undefined },
    coverageRoutes: { type: [coverageRouteSchema], default: undefined },
    fleet: { type: [fleetVehicleSchema], default: undefined },
    totalCapacityHorses: { type: Number, min: 0 },
    serviceOfferings: { type: [serviceOfferingSchema], default: undefined },
    weeklyAvailability: { type: [weeklyAvailabilitySchema], default: undefined },
    ratePerKmFrom: { type: Number, min: 0 },
    currency: { type: String, enum: currencyEnums, default: "USD" },

    /** Trust and discovery */
    verification: { type: verificationProfileSchema, default: () => ({}) },
    ratingSummary: { type: ratingSummarySchema, default: () => ({}) },
    acceptsNewBookings: { type: Boolean, default: true },

    referralCode: { type: String, index: true, sparse: true },
    commissionEligible: { type: Boolean, default: true },

    /** Active collaboration document ids (`WorkplaceRelationship`) */
    collaborators: {
      type: [{ type: Schema.Types.ObjectId, ref: "WorkplaceRelationship" }],
      default: undefined,
    },

    lastActiveAt: { type: Date },
    ...deactivationAuditFields,
    isPublic: { type: Boolean, default: true },
  },
  {
    timestamps: true,
    trim: true,
  }
);

transportSchema.index({ companyName: 1 });
transportSchema.index({ specialties: 1 });
transportSchema.index({ serviceAreas: 1 });
transportSchema.index({ "address.city": 1, "address.country": 1 });
transportSchema.index({ "coOwners.userId": 1 }, { sparse: true });

const Transport = mongoose.models.Transport || model("Transport", transportSchema);
export default Transport;
