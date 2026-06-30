/**
 * User model — single signup identity (one person per email).
 *
 * Role ownership uses two patterns:
 * - **Entity-owned** (horse, stable, riding club, transport): operator is on the entity
 *   (`mainOwnerUserId` on Horse/Stable/RidingClub/Transport) — not mirrored on User.
 * - **User-linked** (breeder, trainer, vet, coach, groom, rider, farrier): one profile per
 *   user via `*ProfileId` on User plus `userId` on the role document.
 *
 * Collaboration at another user's host profile is **not** stored here — use
 * `WorkplaceRelationship` and host `collaborators[]`.
 */

import mongoose, { Schema, model } from "mongoose";
import { personalDetailsSchema } from "./PersonalDetails.ts";
import {
  userDirectMessageAudienceEnums,
  userProfileVisibilityEnums,
} from "../utils/enums.ts";

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

const userPreferencesSchema = new Schema(
  {
    profileVisibility: {
      type: String,
      enum: userProfileVisibilityEnums,
      default: "public",
    },
    searchable: {
      type: Boolean,
      default: true,
    },
    allowDirectMessagesFrom: {
      type: String,
      enum: userDirectMessageAudienceEnums,
      default: "everyone",
    },
  },
  { _id: false },
);

const userSchema = new Schema(
  {
    personalDetails: {
      type: personalDetailsSchema,
      required: [true, "Personal details are required!"],
    },

    /**
     * Horses are entity-owned — no `*ProfileId` on User. Query via Horse.mainOwnerUserId
     * (and coOwners[]). Stables, riding clubs, and transport use the same entity-owned pattern
     * on their respective models.
     */

    /** Position-linked role profiles — one per user */
    breederProfileId: {
      type: Schema.Types.ObjectId,
      ref: "Breeder",
      default: undefined,
      index: true,
    },
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

    /** User-level privacy/discovery preferences for profile exposure. */
    preferences: { type: userPreferencesSchema, default: undefined },

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
