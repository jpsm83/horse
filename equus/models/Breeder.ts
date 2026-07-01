import mongoose, { Schema, model } from "mongoose";
import { addressSchema } from "./sharedSchemas/address.ts";
import {
  coOwnerSchema,
  deactivationAuditFields,
  mediaAssetSchema,
  pedigreeSchema,
  ratingSummarySchema,
  serviceOfferingSchema,
  verificationProfileSchema,
} from "./sharedSchemas/index.ts";
import * as enums from "../utils/enums.ts";

const { horseDisciplineEnums, currencyEnums } = enums;

const breedingStockSchema = new Schema(
  {
    horseId: { type: Schema.Types.ObjectId, ref: "Horse" },
    name: { type: String, required: true },
    sex: { type: String },
    pedigree: { type: pedigreeSchema },
    availabilityStatus: {
      type: String,
      enum: ["available", "reserved", "sold", "not_for_sale"],
      default: "available",
    },
    price: { type: Number, min: 0 },
    currency: { type: String, enum: currencyEnums, default: "USD" },
    notes: { type: String },
  },
  { _id: true }
);

const breederSchema = new Schema(
  {
    /** Ownership — main operator plus optional partners (same pattern as Stable) */
    mainOwnerUserId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: [true, "Main owner user id is required!"],
      index: true,
    },
    coOwners: { type: [coOwnerSchema], default: undefined },

    /** Business identity */
    operationName: { type: String, required: [true, "Operation name is required!"] },
    legalName: { type: String },
    description: { type: String, required: [true, "Description is required!"] },
    email: { type: String, required: [true, "Email is required!"], lowercase: true },
    phoneNumber: { type: String, required: [true, "Phone number is required!"] },
    address: { type: addressSchema, required: [true, "Address is required!"] },
    imageUrl: { type: String },
    gallery: { type: [mediaAssetSchema], default: undefined },

    /** Breeder-specific */
    disciplines: { type: [String], enum: horseDisciplineEnums, default: undefined },
    bloodlines: { type: [String], default: undefined },
    breedingStock: { type: [breedingStockSchema], default: undefined },
    availableFoals: { type: [breedingStockSchema], default: undefined },
    fertilityServicesOffered: { type: Boolean, default: false },
    contractTemplatesAvailable: { type: Boolean, default: false },
    serviceOfferings: { type: [serviceOfferingSchema], default: undefined },

    /** Trust and discovery */
    verification: { type: verificationProfileSchema, default: () => ({}) },
    ratingSummary: { type: ratingSummarySchema, default: () => ({}) },

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

breederSchema.index({ operationName: 1 });
breederSchema.index({ bloodlines: 1 });
breederSchema.index({ "coOwners.userId": 1 }, { sparse: true });

const Breeder = mongoose.models.Breeder || model("Breeder", breederSchema);
export default Breeder;
