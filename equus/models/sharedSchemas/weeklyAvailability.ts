import { Schema } from "mongoose";

/** Weekly opening / availability window */
export const weeklyAvailabilitySchema = new Schema(
  {
    dayOfWeek: { type: Number, min: 0, max: 6, required: true }, // 0 = Sunday
    openTime: { type: String, required: true }, // HH:mm
    closeTime: { type: String, required: true }, // HH:mm
    isClosed: { type: Boolean, default: false },
  },
  { _id: false }
);
