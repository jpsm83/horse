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
  userTypeEnums,
  visibilityEnums,
} from "../utils/enums.ts";
import { tierEnums } from "../utils/enums.ts";

/** Layer-2 per-section visibility for the user public profile hub. */
const userHubSectionSchema = new Schema(
  { mode: { type: String, enum: visibilityEnums, default: "public" } },
  { _id: false },
);

const userHubSectionsSchema = new Schema(
  {
    identity: { type: userHubSectionSchema, default: undefined },
    about: { type: userHubSectionSchema, default: undefined },
    entities: { type: userHubSectionSchema, default: undefined },
    contact: { type: userHubSectionSchema, default: undefined },
  },
  { _id: false },
);

/** Email notification opt-in flags (default all true). */
const notificationPreferencesSchema = new Schema(
  {
    email: {
      type: new Schema(
        {
          relationshipRequests: { type: Boolean, default: true },
          ownershipTransfers: { type: Boolean, default: true },
          workplaceInvitations: { type: Boolean, default: true },
          messages: { type: Boolean, default: true },
          system: { type: Boolean, default: true },
        },
        { _id: false },
      ),
      default: undefined,
    },
  },
  { _id: false },
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

/** Blocked users — unique per blocked user id. */
const userBlockSchema = new Schema(
  {
    blockedUserId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    createdAt: { type: Date, default: Date.now },
  },
  { _id: false },
);

/** Private entity shortcuts — horse and stable in v1; never Users. */
const userFavoriteSchema = new Schema(
  {
    entityType: { type: String, enum: ["horse", "stable"], required: true },
    entityId: { type: Schema.Types.ObjectId, required: true },
    createdAt: { type: Date, default: Date.now },
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

    userType: {
      type: String,
      enum: userTypeEnums,
      default: "individual",
    },
    businessDetails: {
      type: new Schema({
        businessName: { type: String, maxlength: 200 },
        registrationNumber: { type: String, maxlength: 100 },
        taxId: { type: String, maxlength: 100 },
        countryOfRegistration: { type: String, maxlength: 2 },
      }, { _id: false }),
      default: undefined,
    },

    /** Deferred: notifications embed — use Notification collection until product needs inbox on User */
    notifications: { type: [notificationEntrySchema], default: undefined },

    /** Layer-2 per-section visibility for the user hub (public profile preview). */
    hubSections: { type: userHubSectionsSchema, default: undefined },

    /** Email/push notification opt-in preferences. */
    notificationPreferences: { type: notificationPreferencesSchema, default: undefined },

    /** User-level privacy/discovery preferences for profile exposure. */
    preferences: { type: userPreferencesSchema, default: undefined },

    /** Private bookmarks for horses, stables, and future entity modules. */
    favorites: { type: [userFavoriteSchema], default: undefined },

    /** Users this account has blocked from direct messaging. */
    blocks: { type: [userBlockSchema], default: undefined },

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
userSchema.index({ _id: 1, "favorites.entityType": 1, "favorites.entityId": 1 });
userSchema.index({ _id: 1, "blocks.blockedUserId": 1 });

const User = mongoose.models.User || model("User", userSchema);
export default User;
