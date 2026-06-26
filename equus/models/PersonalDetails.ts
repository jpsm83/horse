/**
 * Personal details embed schema — used only on `User.personalDetails`.
 *
 * Only `email` is required at account creation. Profile fields (name, address, ID, etc.)
 * are optional until the user completes them via `PATCH /api/v1/users/me`.
 * Do not insert placeholder values in services; leave unset fields undefined.
 */

import { Schema } from "mongoose";
import { addressSchema } from "./sharedSchemas/address.ts";
import * as enums from "../utils/enums.ts";

const { idTypeEnums, genderEnums } = enums;

export const personalDetailsSchema = new Schema(
  {
    username: { type: String },
    email: {
      type: String,
      required: [true, "Email is required!"],
      unique: true,
      match: [
        /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/,
        "Please enter a valid email address!",
      ],
      lowercase: true,
    },
    emailVerified: { type: Boolean, default: false },
    password: { type: String },
    idType: { type: String, enum: idTypeEnums },
    idNumber: { type: String },
    address: { type: addressSchema },
    firstName: { type: String },
    lastName: { type: String },
    nationality: { type: String },
    gender: { type: String, enum: genderEnums },
    birthDate: { type: Date },
    phoneNumber: { type: String },
    imageUrl: { type: String },
    bio: { type: String },
    preferredLanguage: { type: String },
    timezone: { type: String },
  },
  {
    timestamps: true,
    trim: true,
  },
);
