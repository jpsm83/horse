/**
 * Horse-scoped rating / review model.
 *
 * Tied to `Relationship` + `horseId`. Product policy: reviews are **bidirectional** —
 * either party in an accepted (or ended) horse relationship may review the other in
 * that same horse context. Horses act via owner/co-owner operator; entities via profile operator.
 *
 * Current schema stores `reviewerUserId` → `providerAccountType` / `providerAccountId`
 * (owner-reviews-provider shape). Generalize to symmetric reviewer/reviewee account fields
 * when the rating API ships.
 */

import mongoose, { Schema, model } from "mongoose";
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

    reviewerUserId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: [true, "Reviewer user id is required!"],
      index: true,
    },

    providerAccountType: {
      type: String,
      enum: accountTypeEnums,
      required: [true, "Provider account type is required!"],
    },
    providerAccountId: {
      type: Schema.Types.ObjectId,
      required: [true, "Provider account id is required!"],
      index: true,
    },

    /** Horse-scoped review: one review per horse-provider-reviewer relationship context */
    overallScore: {
      type: Number,
      required: [true, "Overall score is required!"],
      min: 0,
      max: 5,
    },
    categoryScores: { type: [categoryScoreSchema], default: undefined },
    comment: { type: String, maxlength: 2000 },
    providerResponse: { type: String, maxlength: 2000 },
    providerRespondedAt: { type: Date },

    isVerifiedInteraction: { type: Boolean, default: true },
    isPublic: { type: Boolean, default: true },
  },
  {
    timestamps: true,
    trim: true,
  }
);

ratingSchema.index(
  { horseId: 1, reviewerUserId: 1, providerAccountType: 1, providerAccountId: 1 },
  { unique: true }
);
ratingSchema.index({ providerAccountType: 1, providerAccountId: 1, createdAt: -1 });

const Rating = mongoose.models.Rating || model("Rating", ratingSchema);
export default Rating;
