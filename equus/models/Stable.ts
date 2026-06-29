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

const { horseDisciplineEnums, stableServiceEnums } = enums;

const pricingTierSchema = new Schema(
  {
    name: { type: String, required: true }, // e.g. Standard Boarding
    description: { type: String },
    monthlyPrice: { type: Number, min: 0 },
    currency: { type: String, default: "USD" },
    includes: { type: [String], default: undefined },
    isActive: { type: Boolean, default: true },
  },
  { _id: true }
);

const stableSchema = new Schema(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: [true, "User id is required!"],
      index: true,
    },

    /** Business identity */
    tradeName: { type: String, required: [true, "Trade name is required!"] },
    legalName: { type: String },
    description: { type: String, required: [true, "Description is required!"] },
    email: { type: String, required: [true, "Email is required!"], lowercase: true },
    phoneNumber: { type: String, required: [true, "Phone number is required!"] },
    websiteUrl: { type: String },
    address: { type: addressSchema, required: [true, "Address is required!"] },

    /** Profile media */
    imageUrl: { type: String },
    gallery: { type: [mediaAssetSchema], default: undefined },

    /** Stable-specific operations */
    disciplines: { type: [String], enum: horseDisciplineEnums, default: undefined },
    services: { type: [String], enum: stableServiceEnums, default: undefined },
    facilities: { type: [String], default: undefined }, // indoor arena, outdoor arena, walker, etc.
    stallCapacity: { type: Number, min: 0 },
    availableBoardingSlots: { type: Number, min: 0 },
    pricingTiers: { type: [pricingTierSchema], default: undefined },
    serviceOfferings: { type: [serviceOfferingSchema], default: undefined },
    weeklyAvailability: { type: [weeklyAvailabilitySchema], default: undefined },

    /** Discovery and trust */
    verification: { type: verificationProfileSchema, default: () => ({}) },
    ratingSummary: { type: ratingSummarySchema, default: () => ({}) },
    acceptsNewHorses: { type: Boolean, default: true },

    /** Partner program */
    referralCode: { type: String, index: true, sparse: true },
    commissionEligible: { type: Boolean, default: true },

    /** Active collaboration document ids (`WorkplaceRelationship`) */
    collaborators: {
      type: [{ type: Schema.Types.ObjectId, ref: "WorkplaceRelationship" }],
      default: undefined,
    },

    /** Activity tracking */
    lastActiveAt: { type: Date },
    isActive: { type: Boolean, default: true },
    isPublic: { type: Boolean, default: true },
  },
  {
    timestamps: true,
    trim: true,
  }
);

stableSchema.index({ tradeName: 1 });
stableSchema.index({ disciplines: 1 });
stableSchema.index({ "address.city": 1, "address.country": 1 });

const Stable = mongoose.models.Stable || model("Stable", stableSchema);
export default Stable;
