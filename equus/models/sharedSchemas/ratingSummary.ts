import { Schema } from "mongoose";

/** Cached aggregate rating on business profiles */
export const ratingSummarySchema = new Schema(
  {
    averageScore: { type: Number, min: 0, max: 5, default: 0 },
    ratingCount: { type: Number, min: 0, default: 0 },
    categoryAverages: {
      communication: { type: Number, min: 0, max: 5 },
      horseCare: { type: Number, min: 0, max: 5 },
      transparency: { type: Number, min: 0, max: 5 },
      professionalism: { type: Number, min: 0, max: 5 },
      facilities: { type: Number, min: 0, max: 5 },
      results: { type: Number, min: 0, max: 5 },
      availability: { type: Number, min: 0, max: 5 },
    },
  },
  { _id: false }
);
