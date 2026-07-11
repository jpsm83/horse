/**
 * Co-owner embed — syndicate / partnership ownership on entity-owned profiles.
 *
 * Used by Horse, Stable, and RidingClub. Main operator remains `mainOwnerUserId`.
 */

import { Schema } from "mongoose";

export const coOwnerSchema = new Schema(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: [true, "Co-owner user id is required!"],
    },
    ownershipPercentage: {
      type: Number,
      min: 0,
      max: 100,
      required: [true, "Ownership percentage is required!"],
    },
    joinedAt: { type: Date, default: Date.now },
  },
  { _id: true },
);
