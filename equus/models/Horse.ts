/**
 * Horse model — horse profiles owned by users.
 *
 * Discovery visibility and public contact are per horse (`profileVisibility`, `contactDisplay`),
 * not on the User document.
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

const competitionResultSchema = new Schema(
  {
    eventName: { type: String, required: true },
    eventDate: { type: Date, required: true },
    discipline: { type: String, enum: horseDisciplineEnums },
    placement: { type: String },
    score: { type: Number },
    location: { type: String },
    notes: { type: String },
    recordedByAccountType: { type: String },
    recordedByAccountId: { type: Schema.Types.ObjectId },
  },
  { _id: true, timestamps: true }
);

/** Public contact shown for this horse when discovered (defaults to main owner contact). */
const horseContactDisplaySchema = new Schema(
  {
    useOwnerContact: { type: Boolean, default: true },
    name: { type: String },
    phone: { type: String },
    email: { type: String },
  },
  { _id: false }
);

const horseSchema = new Schema(
  {
    /** Identity */
    name: { type: String, required: [true, "Horse name is required!"], trim: true },
    registeredName: { type: String, trim: true },
    registryId: { type: String, index: true },
    microchipId: { type: String, index: true, sparse: true },
    passportNumber: { type: String, index: true, sparse: true },
    breed: { type: String, enum: horseBreedEnums, required: [true, "Breed is required!"] },
    sex: { type: String, enum: horseSexEnums, required: [true, "Sex is required!"] },
    dateOfBirth: { type: Date },
    ageYears: { type: Number, min: 0 },
    color: { type: String, enum: horseColorEnums },
    marksDescription: { type: String },
    heightHands: { type: Number, min: 0 },
    primaryDiscipline: { type: String, enum: horseDisciplineEnums },
    disciplines: { type: [String], enum: horseDisciplineEnums, default: undefined },
    countryOfBirth: { type: String },
    importExportStatus: { type: String },

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
    acquisitionSource: { type: String },

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
    gallery: { type: [mediaAssetSchema], default: undefined },
    description: { type: String },
    notes: { type: String },

    /** Competition */
    competitionResults: { type: [competitionResultSchema], default: undefined },

    /** Discovery — per horse, not per user */
    profileVisibility: { type: String, enum: visibilityEnums, default: "public" },
    contactDisplay: {
      type: horseContactDisplaySchema,
      default: () => ({ useOwnerContact: true }),
    },
    showValuePublicly: { type: Boolean, default: false },

    /** Operational flags */
    ...deactivationAuditFields,
    createdByUserId: { type: Schema.Types.ObjectId, ref: "User", required: true },
  },
  {
    timestamps: true,
    trim: true,
  }
);

horseSchema.index({ name: 1, mainOwnerUserId: 1 });
horseSchema.index({ "coOwners.userId": 1 }, { sparse: true });
horseSchema.index({ saleStatus: 1, primaryDiscipline: 1 });
horseSchema.index({ "registration.isActive": 1 });
horseSchema.index({ "registration.referralReference": 1 }, { sparse: true });

const Horse = mongoose.models.Horse || model("Horse", horseSchema);
export default Horse;
