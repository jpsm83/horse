import mongoose, { Schema, model } from "mongoose";
import { addressSchema } from "./sharedSchemas/address.ts";
import {
  mediaAssetSchema,
  ratingSummarySchema,
  verificationProfileSchema,
  weeklyAvailabilitySchema,
} from "./sharedSchemas/index.ts";
import * as enums from "../packages/enums.ts";

const { horseDisciplineEnums } = enums;

const clubEventSchema = new Schema(
  {
    name: { type: String, required: true },
    description: { type: String },
    startDate: { type: Date, required: true },
    endDate: { type: Date },
    discipline: { type: String, enum: horseDisciplineEnums },
    location: { type: String },
    registrationUrl: { type: String },
    isPublic: { type: Boolean, default: true },
  },
  { _id: true }
);

const ridingClubSchema = new Schema(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: [true, "User id is required!"],
      index: true,
    },

    /** Club identity */
    clubName: { type: String, required: [true, "Club name is required!"] },
    legalName: { type: String },
    description: { type: String, required: [true, "Description is required!"] },
    email: { type: String, required: [true, "Email is required!"], lowercase: true },
    phoneNumber: { type: String, required: [true, "Phone number is required!"] },
    address: { type: addressSchema, required: [true, "Address is required!"] },
    imageUrl: { type: String },
    gallery: { type: [mediaAssetSchema], default: undefined },

    /** Club-specific */
    disciplines: { type: [String], enum: horseDisciplineEnums, default: undefined },
    facilities: { type: [String], default: undefined },
    membershipInfo: { type: String },
    membershipFee: { type: Number, min: 0 },
    events: { type: [clubEventSchema], default: undefined },
    weeklyAvailability: { type: [weeklyAvailabilitySchema], default: undefined },
    acceptsNewMembers: { type: Boolean, default: true },

    /** Trust and discovery */
    verification: { type: verificationProfileSchema, default: () => ({}) },
    ratingSummary: { type: ratingSummarySchema, default: () => ({}) },

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

ridingClubSchema.index({ clubName: 1 });
ridingClubSchema.index({ disciplines: 1 });

const RidingClub = mongoose.models.RidingClub || model("RidingClub", ridingClubSchema);
export default RidingClub;
