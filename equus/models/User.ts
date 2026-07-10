/**
 * User model — single signup identity (one person per email).
 *
 * Role ownership uses two patterns:
 * - **Entity-owned** (horse, stable, riding club, transport, breeder): operator is on the
 *   entity (`mainOwnerUserId` on Horse/Stable/RidingClub/Transport/Breeder) — not mirrored on User.
 * - **User-linked** (trainer, vet, coach, groom, rider, farrier): one profile per user via
 *   `*ProfileId` on User plus `userId` on the role document.
 *
 * Collaboration at another user's host profile is **not** stored here — use
 * `WorkplaceRelationship` and host `collaborators[]`.
 */

import mongoose, { Schema, model } from "mongoose";
import { personalDetailsSchema } from "./PersonalDetails.ts";
import { deactivationAuditFields } from "./sharedSchemas/deactivationAudit.ts";
import {
  userDirectMessageAudienceEnums,
  userProfileVisibilityEnums,
} from "../utils/enums.ts";
import { tierEnums } from "@/lib/billing/plans.ts";

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
     * Horses and host business entities are entity-owned — no `*ProfileId` on User.
     * Query via mainOwnerUserId (and coOwners[]) on Horse, Stable, RidingClub, Transport, Breeder.
     */

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

    /** User-level privacy/discovery preferences for profile exposure. */
    preferences: { type: userPreferencesSchema, default: undefined },

    /** Auth lifecycle */
    emailVerified: { type: Boolean, default: false },
    verificationToken: { type: String, default: undefined },
    resetPasswordToken: { type: String, default: undefined },
    resetPasswordExpires: { type: Date, default: undefined },
    refreshSessionVersion: { type: Number, default: 0 },
    googleSubjectId: { type: String, default: undefined },
    authProvider: {
      type: String,
      enum: ["credentials", "google"],
      default: "credentials",
    },

    subscription: {
      tier: { type: String, enum: tierEnums, default: "free" },
      status: {
        type: String,
        enum: ["trial", "active", "past_due", "canceled", "incomplete"],
        default: "trial",
      },
      stripeCustomerId: { type: String },
      stripeSubscriptionId: { type: String },
      trialEndsAt: { type: Date },
      currentPeriodStart: { type: Date },
      currentPeriodEnd: { type: Date },
      currency: {
        type: String,
        enum: ["USD", "EUR", "GBP", "BRL", "CAD", "AUD", "CHF", "JPY"],
        default: "USD",
      },
      discountPercentage: { type: Number, default: 0, min: 0, max: 100 },
      discountValidUntil: { type: Date },
      canceledAt: { type: Date },
    },

    lastLoginAt: { type: Date },
    lastActiveAt: { type: Date },
    ...deactivationAuditFields,

    /** GDPR / regulatory erasure — personal PII scrubbed; `_id` retained for referential integrity */
    piiAnonymizedAt: { type: Date, default: undefined },
    piiAnonymizedByUserId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      default: undefined,
    },
  },
  {
    timestamps: true,
    trim: true,
  }
);

userSchema.index({ "personalDetails.username": 1 }, { unique: true, sparse: true });
userSchema.index({ "notifications.notificationId": 1 });
userSchema.index({ verificationToken: 1 }, { sparse: true });
userSchema.index({ resetPasswordToken: 1 }, { sparse: true });
userSchema.index({ googleSubjectId: 1 }, { unique: true, sparse: true });

const User = mongoose.models.User || model("User", userSchema);
export default User;
