/**
 * Horse-scoped rating / review model.
 *
 * Tied to `Relationship` + `horseId`. Reviews are **bidirectional** —
 * either party in an accepted (or ended) horse relationship may review the other in
 * that same horse context. Horses act via owner/co-owner operator; entities via profile operator.
 *
 * Symmetric `revieweeUserId` + `revieweeAccountType` / `revieweeAccountId` support
 * both directions: owner reviews provider (reviewee = provider) and provider reviews owner
 * (reviewee = owner/user).
 */

import mongoose, { Schema, model } from "mongoose";
import { deactivationAuditFields } from "./sharedSchemas/deactivationAudit.ts";
import * as enums from "../utils/enums.ts";

const { ratingCategoryEnums, accountTypeEnums } = enums;

const categoryScoreSchema = new Schema(
  {
    category: { type: String, enum: ratingCategoryEnums, required: true },
    score: { type: Number, min: 0, max: 5, required: true },
  },
  { _id: false }
);

const ratingSchema = new Schema(
  {
    horseId: {
      type: Schema.Types.ObjectId,
      ref: "Horse",
      required: [true, "Horse id is required!"],
      index: true,
    },
    relationshipId: {
      type: Schema.Types.ObjectId,
      ref: "Relationship",
      required: [true, "Relationship id is required!"],
      index: true,
    },

    /** User who wrote the review */
    reviewerUserId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: [true, "Reviewer user id is required!"],
      index: true,
    },

    /** User being reviewed (symmetric — works for both directions) */
    revieweeUserId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: [true, "Reviewee user id is required!"],
      index: true,
    },
    revieweeAccountType: {
      type: String,
      enum: accountTypeEnums,
    },
    revieweeAccountId: {
      type: Schema.Types.ObjectId,
      index: true,
    },

    /** Horse-scoped review: one review per horse-relationship-reviewer */
    overallScore: {
      type: Number,
      required: [true, "Overall score is required!"],
      min: 0,
      max: 5,
    },
    categoryScores: { type: [categoryScoreSchema], default: undefined },
    comment: { type: String, maxlength: 2000 },
    response: { type: String, maxlength: 2000 },
    respondedAt: { type: Date },

    isVerifiedInteraction: { type: Boolean, default: true },
    isPublic: { type: Boolean, default: true },

    ...deactivationAuditFields,
  },
  {
    timestamps: true,
    trim: true,
  }
);

ratingSchema.index(
  { horseId: 1, reviewerUserId: 1, revieweeAccountType: 1, revieweeAccountId: 1 },
  { unique: true }
);
ratingSchema.index({ revieweeAccountType: 1, revieweeAccountId: 1, createdAt: -1 });

const Rating = mongoose.models.Rating || model("Rating", ratingSchema);
export default Rating;
