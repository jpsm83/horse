import mongoose, { Schema, model } from "mongoose";
import * as enums from "../packages/enums.ts";

const { relationshipTypeEnums, relationshipStatusEnums, accountTypeEnums } = enums;

const relationshipSchema = new Schema(
  {
    horseId: {
      type: Schema.Types.ObjectId,
      ref: "Horse",
      required: [true, "Horse id is required!"],
      index: true,
    },

    relationshipType: {
      type: String,
      enum: relationshipTypeEnums,
      required: [true, "Relationship type is required!"],
    },

    status: {
      type: String,
      enum: relationshipStatusEnums,
      default: "pending",
      index: true,
    },

    /** Requester side */
    requesterUserId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: [true, "Requester user id is required!"],
      index: true,
    },
    requesterAccountType: { type: String, enum: accountTypeEnums },
    requesterAccountId: { type: Schema.Types.ObjectId },

    /** Receiver side */
    receiverUserId: { type: Schema.Types.ObjectId, ref: "User", index: true },
    receiverAccountType: {
      type: String,
      enum: accountTypeEnums,
      required: [true, "Receiver account type is required!"],
    },
    receiverAccountId: { type: Schema.Types.ObjectId, index: true },

    /** Invitation for non-registered users */
    invitedEmail: { type: String, lowercase: true },
    invitedName: { type: String },
    referralReference: { type: String, index: true, sparse: true },

    /** Lifecycle timestamps */
    requestedAt: { type: Date, default: Date.now },
    respondedAt: { type: Date },
    endedAt: { type: Date },

    /** Historical traceability when relationship ends/rejects */
    historicalReference: {
      requesterLabel: { type: String },
      receiverLabel: { type: String },
      horseNameSnapshot: { type: String },
      endedReason: { type: String },
    },

    requestMessage: { type: String },
    responseMessage: { type: String },
  },
  {
    timestamps: true,
    trim: true,
  }
);

relationshipSchema.index({ horseId: 1, relationshipType: 1, status: 1 });
relationshipSchema.index({ receiverAccountType: 1, receiverAccountId: 1, status: 1 });
relationshipSchema.index(
  { horseId: 1, receiverAccountType: 1, receiverAccountId: 1 },
  { unique: true, partialFilterExpression: { status: "accepted" } }
);

const Relationship =
  mongoose.models.Relationship || model("Relationship", relationshipSchema);
export default Relationship;
