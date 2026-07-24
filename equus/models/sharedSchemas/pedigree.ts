import { Schema } from "mongoose";

/** Basic pedigree block for horse and breeder modules */
export const pedigreeSchema = new Schema(
  {
    sireName: { type: String },
    sireHorseId: { type: Schema.Types.ObjectId, ref: "Horse" },
    damName: { type: String },
    damHorseId: { type: Schema.Types.ObjectId, ref: "Horse" },
    breederAccountId: { type: Schema.Types.ObjectId, ref: "Breeder" },
    bloodlineNotes: { type: String },
    registryUrl: { type: String },
  },
  { _id: false }
);
