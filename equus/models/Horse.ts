/**
 * Horse model — horse profiles owned by users.
 *
 * Discovery visibility is per horse (`profileVisibility`), not on the User document.
 * Public contact always resolves from the main owner (subject to owner privacy).
 */

import mongoose, { Schema, model } from "mongoose";
import { coOwnerSchema, deactivationAuditFields, mediaAssetSchema, pedigreeSchema } from "./sharedSchemas/index.ts";
import * as enums from "../utils/enums.ts";

const {
  horseSexEnums,
  horseColorEnums,
  horseBreedEnums,
  horseDisciplineEnums,
  saleStatusEnums,
  currencyEnums,
  visibilityEnums,
  accountTypeEnums,
} = enums;

const horseRegistrationSchema = new Schema(
  {
    addedAt: { type: Date, default: Date.now },
    isActive: { type: Boolean, default: true },
    dateOfDeath: { type: Date, default: null },
    dataAvailability: {
      type: String,
      enum: ["available", "payment_blocked"],
      default: "available",
    },
    payerUserId: { type: Schema.Types.ObjectId, ref: "User" },
    // Commission tracking
    attributedAccountType: { type: String, enum: accountTypeEnums },
    attributedAccountId: { type: Schema.Types.ObjectId },
    referralReference: { type: String },
    commissionEligibleUntil: { type: Date },
  },
  { _id: false }
);

const horseWaitingTransferSchema = new Schema(
  {
    active: { type: Boolean, required: true, default: true },
    invitedOwnerEmail: { type: String, required: true, lowercase: true, trim: true },
    hostStableId: { type: Schema.Types.ObjectId, ref: "Stable", required: true, index: true },
    createdAt: { type: Date, default: Date.now },
    nagLastSentAt: { type: Date },
  },
  { _id: false },
);

const horseSchema = new Schema(
  {
    /** Identity */
    name: { type: String, required: [true, "Horse name is required!"], trim: true },
    registeredName: { type: String, trim: true },
    registryId: { type: String },
    microchipId: { type: String },
    passportNumber: { type: String },
    breed: { type: String, enum: horseBreedEnums, required: [true, "Breed is required!"] },
    sex: { type: String, enum: horseSexEnums, required: [true, "Sex is required!"] },
    dateOfBirth: { type: Date },
    color: { type: String, enum: horseColorEnums },
    heightHands: { type: Number, min: 0 },
    disciplines: { type: [String], enum: horseDisciplineEnums, default: undefined },
    countryOfBirth: { type: String },

    /** Ownership */
    mainOwnerUserId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: [true, "Main owner user id is required!"],
      index: true,
    },
    coOwners: { type: [coOwnerSchema], default: undefined },
    responsibles: {
      type: [{
        userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
        joinedAt: { type: Date, default: Date.now },
      }],
      default: undefined,
    },

    /** Commercial */
    estimatedValue: { type: Number, min: 0 },
    valueCurrency: { type: String, enum: currencyEnums, default: "USD" },
    saleStatus: { type: String, enum: saleStatusEnums, default: "not_for_sale" },
    askingPrice: { type: Number, min: 0 },
    acquisitionDate: { type: Date },
    /**
     * Read-only acquisition source — user the horse was acquired from.
     * Auto-set to the creating owner; updated on ownership transfer (sale).
     * Falls back to the current owner for display when unset.
     */
    acquisitionSourceUserId: { type: Schema.Types.ObjectId, ref: "User" },

    /** Registration — lifecycle + payment gating per horse */
    registration: {
      type: horseRegistrationSchema,
      required: true,
      default: () => ({}),
    },

    /** Pedigree / breeding */
    pedigree: { type: pedigreeSchema, default: undefined },

    /** Media and profile */
    profileImageUrl: { type: String },
    /** Hub cover / hero band image URL (denormalized from Media). */
    heroImageUrl: { type: String },
    gallery: { type: [mediaAssetSchema], default: undefined },
    description: { type: String },

    /** Discovery — per horse, not per user */
    profileVisibility: { type: String, enum: visibilityEnums, default: "public" },

    /**
     * Hub Layer-2 visibility per social section (`public` | `relationship` | `owner`).
     * No per-section entity allowlists — audiences are team / relationships+collaborators / public.
     */
    hubSections: {
      type: {
        identity: { mode: { type: String, enum: visibilityEnums, default: "public" } },
        identification: { mode: { type: String, enum: visibilityEnums, default: "public" } },
        pedigree: { mode: { type: String, enum: visibilityEnums, default: "public" } },
        about: { mode: { type: String, enum: visibilityEnums, default: "public" } },
        ownership: { mode: { type: String, enum: visibilityEnums, default: "relationship" } },
        value: { mode: { type: String, enum: visibilityEnums, default: "owner" } },
        proactiveRepresentatives: {
          mode: { type: String, enum: visibilityEnums, default: "owner" },
        },
        coOwnerManagement: { mode: { type: String, enum: visibilityEnums, default: "owner" } },
        gallery: { mode: { type: String, enum: visibilityEnums, default: "public" } },
        planning: { mode: { type: String, enum: visibilityEnums, default: "public" } },
        connections: { mode: { type: String, enum: visibilityEnums, default: "relationship" } },
      },
      default: () => ({
        identity: { mode: "public" },
        identification: { mode: "public" },
        pedigree: { mode: "public" },
        about: { mode: "public" },
        ownership: { mode: "relationship" },
        value: { mode: "owner" },
        proactiveRepresentatives: { mode: "owner" },
        coOwnerManagement: { mode: "owner" },
        gallery: { mode: "public" },
        planning: { mode: "public" },
        connections: { mode: "relationship" },
      }),
    },

    /** Operational flags */
    ...deactivationAuditFields,
    createdByUserId: { type: Schema.Types.ObjectId, ref: "User", required: true },

    /** Waiting-transfer — stable creates horse before real owner claims */
    waitingTransfer: { type: horseWaitingTransferSchema, default: undefined },
  },
  {
    timestamps: true,
    trim: true,
  }
);

horseSchema.index({ name: 1, mainOwnerUserId: 1 });
horseSchema.index({ "coOwners.userId": 1 }, { sparse: true });
horseSchema.index({ saleStatus: 1, disciplines: 1 });
horseSchema.index({ "registration.isActive": 1 });
horseSchema.index({ "registration.referralReference": 1 }, { sparse: true });
horseSchema.index({ registryId: 1 }, { unique: true, sparse: true });
horseSchema.index({ microchipId: 1 }, { unique: true, sparse: true });
horseSchema.index({ passportNumber: 1 }, { unique: true, sparse: true });
horseSchema.index({ "waitingTransfer.active": 1, "waitingTransfer.nagLastSentAt": 1 });

const Horse = mongoose.models.Horse || model("Horse", horseSchema);
export default Horse;
