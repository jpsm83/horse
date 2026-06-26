/**
 * Address embed schema — nested under `personalDetails.address`.
 *
 * The address object itself is optional on the user profile. When present, all required
 * subfields must be set (enforced by Mongoose on save).
 */

import { Schema } from "mongoose";

export const addressSchema = new Schema({
  country: { type: String },
  state: { type: String },
  city: { type: String },
  street: { type: String },
  buildingNumber: { type: String },
  doorNumber: { type: String },
  complement: { type: String },
  postCode: { type: String },
  region: { type: String },
  additionalDetails: { type: String },
  coordinates: { type: [Number], default: undefined }, // [longitude, latitude]
});
