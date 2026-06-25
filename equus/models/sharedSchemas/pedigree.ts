import { Schema } from "mongoose";

/** Basic pedigree block for horse and breeder modules */
export const pedigreeSchema = new Schema(
  {
    sireName: { type: String },
    sireId: { type: String },
    damName: { type: String },
    damId: { type: String },
    breederAccountId: { type: Schema.Types.ObjectId, ref: "Breeder" },
    bloodlineNotes: { type: String },
    registryUrl: { type: String },
  },
  { _id: false }
);
