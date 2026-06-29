/**
 * User model — single signup identity (one person per email).
 *
 * `*ProfileId(s)` fields list role profiles this User **owns** (subsections).
 * Collaboration at another user's stable is **not** stored here — use
 * `WorkplaceRelationship` and `Stable.collaborators[]`.
 */

import mongoose, { Schema, model } from "mongoose";
import { personalDetailsSchema } from "./PersonalDetails.ts";

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

const userSchema = new Schema(
  {
    personalDetails: {
      type: personalDetailsSchema,
      required: [true, "Personal details are required!"],
    },

    /**
     * Owner is a role on this user, not a separate collection.
     * Horses owned by this user are queried via Horse.mainOwnerUserId.
     */

    /** Role profiles — stable, breeder, club, transport (user may have multiple) */
    stableProfileIds: {
      type: [{ type: Schema.Types.ObjectId, ref: "Stable" }],
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

    /** Position-linked role profiles — one per user */
    trainerProfileId: {
      type: Schema.Types.ObjectId,
      ref: "Trainer",
      default: undefined,
      index: true,
    },
    veterinaryProfileId: {
      type: Schema.Types.ObjectId,
      ref: "Veterinary",
      default: undefined,
      index: true,
    },
    coachProfileId: {
      type: Schema.Types.ObjectId,
      ref: "Coach",
      default: undefined,
      index: true,
    },
    riderProfileId: {
      type: Schema.Types.ObjectId,
      ref: "Rider",
      default: undefined,
      index: true,
    },
    groomProfileId: {
      type: Schema.Types.ObjectId,
      ref: "Groom",
      default: undefined,
      index: true,
    },
    farrierProfileId: {
      type: Schema.Types.ObjectId,
      ref: "Farrier",
      default: undefined,
      index: true,
    },

  /** Deferred: notifications embed — use Notification collection until product needs inbox on User */
    notifications: { type: [notificationEntrySchema], default: undefined },

    /** Auth lifecycle */
    emailVerified: { type: Boolean, default: false },
    verificationToken: { type: String, default: undefined },
    resetPasswordToken: { type: String, default: undefined },
    resetPasswordExpires: { type: Date, default: undefined },
    refreshSessionVersion: { type: Number, default: 0 },
    googleSubjectId: { type: String, default: undefined, index: true },
    authProvider: {
      type: String,
      enum: ["credentials", "google"],
      default: "credentials",
    },

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
userSchema.index({ googleSubjectId: 1 }, { unique: true, sparse: true });

const User = mongoose.models.User || model("User", userSchema);
export default User;
