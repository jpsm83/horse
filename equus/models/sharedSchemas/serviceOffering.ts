import { Schema } from "mongoose";

/** Service offering displayed on business profiles */
export const serviceOfferingSchema = new Schema(
  {
    name: { type: String, required: [true, "Service name is required!"] },
    description: { type: String },
    discipline: { type: String },
    priceFrom: { type: Number, min: 0 },
    priceTo: { type: Number, min: 0 },
    currency: { type: String, default: "USD" },
    unit: { type: String }, // e.g. per month, per session, per km
    isActive: { type: Boolean, default: true },
  },
  { _id: true }
);
