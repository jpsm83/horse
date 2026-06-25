import mongoose, { Schema, model } from "mongoose";
import { personalDetailsSchema } from "./PersonalDetails.ts";
import * as enums from "../packages/enums.ts";

const { accountTypeEnums, visibilityEnums } = enums;

/** Owner visibility and discovery preferences (owner is a role, not a separate account) */
const ownerPreferencesSchema = new Schema(
  {
    profileVisibility: {
      type: String,
      enum: visibilityEnums,
      default: "relationship",
    },
    showOwnedHorsesPublicly: { type: Boolean, default: false },
    showContactPublicly: { type: Boolean, default: false },
  },
  { _id: false }
);

const notificationEntrySchema = new Schema(
  {
    notificationId: {
      type: Schema.Types.ObjectId,
      ref: "Notification",
      required: true,
    },
    readFlag: { type: Boolean, default: false },
    deletedFlag: { type: Boolean, default: false },
  },
  { _id: false }
);

const activeAccountContextSchema = new Schema(
  {
    accountType: { type: String, enum: accountTypeEnums, required: true },
    accountId: { type: Schema.Types.ObjectId, required: true },
  },
  { _id: false }
);

const userSchema = new Schema(
  {
    personalDetails: {
      type: personalDetailsSchema,
      required: [true, "Personal details are required!"],
    },

    /**
     * Owner is a user role, not a separate account collection.
     * Horses owned by this user are queried via Horse.mainOwnerUserId.
     */
    ownerPreferences: { type: ownerPreferencesSchema, default: undefined },

    /** Business profile collections owned by this user (multi-account model) */
    stableProfileIds: {
      type: [{ type: Schema.Types.ObjectId, ref: "Stable" }],
      default: undefined,
    },
    trainerProfileIds: {
      type: [{ type: Schema.Types.ObjectId, ref: "Trainer" }],
      default: undefined,
    },
    veterinaryProfileIds: {
      type: [{ type: Schema.Types.ObjectId, ref: "Veterinary" }],
      default: undefined,
    },
    breederProfileIds: {
      type: [{ type: Schema.Types.ObjectId, ref: "Breeder" }],
      default: undefined,
    },
    ridingClubProfileIds: {
      type: [{ type: Schema.Types.ObjectId, ref: "RidingClub" }],
      default: undefined,
    },
    transportProfileIds: {
      type: [{ type: Schema.Types.ObjectId, ref: "Transport" }],
      default: undefined,
    },
    coachProfileIds: {
      type: [{ type: Schema.Types.ObjectId, ref: "Coach" }],
      default: undefined,
    },

    /** UI context switching between account types */
    activeAccountContext: { type: activeAccountContextSchema, default: undefined },

    notifications: { type: [notificationEntrySchema], default: undefined },

    /** Auth lifecycle */
    emailVerified: { type: Boolean, default: false },
    verificationToken: { type: String, default: undefined },
    resetPasswordToken: { type: String, default: undefined },
    resetPasswordExpires: { type: Date, default: undefined },
    refreshSessionVersion: { type: Number, default: 0 },

    lastLoginAt: { type: Date },
    lastActiveAt: { type: Date },
    isActive: { type: Boolean, default: true },
  },
  {
    timestamps: true,
    trim: true,
  }
);

userSchema.index({ "personalDetails.email": 1 }, { unique: true });
userSchema.index({ "notifications.notificationId": 1 });
userSchema.index({ verificationToken: 1 }, { sparse: true });
userSchema.index({ resetPasswordToken: 1 }, { sparse: true });

const User = mongoose.models.User || model("User", userSchema);
export default User;
