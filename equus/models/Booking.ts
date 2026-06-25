import mongoose, { Schema, model } from "mongoose";
import * as enums from "../utils/enums.ts";

const { bookingStatusEnums, accountTypeEnums } = enums;

const bookingSchema = new Schema(
  {
    horseId: {
      type: Schema.Types.ObjectId,
      ref: "Horse",
      required: [true, "Horse id is required!"],
      index: true,
    },

    requesterUserId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: [true, "Requester user id is required!"],
      index: true,
    },

    providerAccountType: {
      type: String,
      enum: accountTypeEnums,
      required: [true, "Provider account type is required!"],
    },
    providerAccountId: {
      type: Schema.Types.ObjectId,
      required: [true, "Provider account id is required!"],
      index: true,
    },

    serviceType: { type: String, required: [true, "Service type is required!"] },
    title: { type: String, required: [true, "Booking title is required!"] },
    description: { type: String },

    scheduledStart: { type: Date, required: [true, "Scheduled start is required!"] },
    scheduledEnd: { type: Date },
    location: { type: String },

    status: {
      type: String,
      enum: bookingStatusEnums,
      default: "pending",
      index: true,
    },

    requestMessage: { type: String },
    responseMessage: { type: String },
    respondedAt: { type: Date },
    completedAt: { type: Date },
    canceledAt: { type: Date },

    /** Optional link to chat thread used for coordination */
    chatThreadId: { type: String },
  },
  {
    timestamps: true,
    trim: true,
  }
);

bookingSchema.index({ providerAccountType: 1, providerAccountId: 1, scheduledStart: 1 });
bookingSchema.index({ requesterUserId: 1, status: 1, scheduledStart: 1 });

const Booking = mongoose.models.Booking || model("Booking", bookingSchema);
export default Booking;
