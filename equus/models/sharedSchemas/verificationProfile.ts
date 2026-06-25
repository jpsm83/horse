import { Schema } from "mongoose";
import * as enums from "../../utils/enums.ts";

const { verificationStatusEnums } = enums;

/** Trust verification and earned badge metadata */
export const verificationProfileSchema = new Schema(
  {
    status: {
      type: String,
      enum: verificationStatusEnums,
      default: "unverified",
    },
    verifiedAt: { type: Date },
    verifiedByUserId: { type: Schema.Types.ObjectId, ref: "User" },
    badges: {
      type: [
        {
          key: { type: String, required: true }, // e.g. cares_for_25_horses
          label: { type: String, required: true },
          earnedAt: { type: Date, default: Date.now },
          expiresAt: { type: Date },
        },
      ],
      default: undefined,
    },
  },
  { _id: false }
);
