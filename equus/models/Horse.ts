/**
 * Horse model — horse profiles owned by users.
 *
 * Discovery visibility and public contact are per horse (`profileVisibility`, `contactDisplay`),
 * not on the User document.
 */

import mongoose, { Schema, model } from "mongoose";
import { coOwnerSchema, mediaAssetSchema, pedigreeSchema } from "./sharedSchemas/index.ts";
import * as enums from "../utils/enums.ts";

const {
  horseSexEnums,
  horseColorEnums,
  horseDisciplineEnums,
  saleStatusEnums,
  currencyEnums,
  visibilityEnums,
  horseSubscriptionStatusEnums,
  accountTypeEnums,
} = enums;

const horseSubscriptionSchema = new Schema(
  {
    status: {
      type: String,
      enum: horseSubscriptionStatusEnums,
      default: "trial",
    },
    monthlyFee: { type: Number, default: 99 },
    currency: { type: String, enum: currencyEnums, default: "USD" },
    trialStartedAt: { type: Date },
    trialEndsAt: { type: Date },
    subscriptionStartedAt: { type: Date },
    canceledAt: { type: Date },
    /** Business account that referred this horse (commission attribution) */
    attributedAccountType: { type: String, enum: accountTypeEnums },
    attributedAccountId: { type: Schema.Types.ObjectId },
    referralReference: { type: String, index: true },
    commissionEligibleUntil: { type: Date }, // first 12 paid months window
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
    breed: { type: String, required: [true, "Breed is required!"] },
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

    /** Commercial */
    estimatedValue: { type: Number, min: 0 },
    valueCurrency: { type: String, enum: currencyEnums, default: "USD" },
    saleStatus: { type: String, enum: saleStatusEnums, default: "not_for_sale" },
    askingPrice: { type: Number, min: 0 },
    acquisitionDate: { type: Date },
    acquisitionSource: { type: String },

    /** Subscription (owner pays per horse) */
    subscription: {
      type: horseSubscriptionSchema,
      required: true,
      default: () => ({ status: "trial", monthlyFee: 99, currency: "USD" }),
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
    isActive: { type: Boolean, default: true },
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
horseSchema.index({ "subscription.status": 1 });
horseSchema.index({ "subscription.referralReference": 1 }, { sparse: true });

const Horse = mongoose.models.Horse || model("Horse", horseSchema);
export default Horse;
