import mongoose, { Schema, model } from "mongoose";
import * as enums from "../packages/enums.ts";

const { notificationTypeEnums } = enums;

const notificationSchema = new Schema(
  {
    notificationType: {
      type: String,
      enum: notificationTypeEnums,
      required: [true, "Notification type is required!"],
    },
    title: { type: String, required: [true, "Title is required!"] },
    message: { type: String, required: [true, "Message is required!"] },

    recipientUserIds: {
      type: [{ type: Schema.Types.ObjectId, ref: "User" }],
      required: [true, "At least one recipient is required!"],
      index: true,
    },
    senderUserId: { type: Schema.Types.ObjectId, ref: "User" },

    /** Optional context links */
    horseId: { type: Schema.Types.ObjectId, ref: "Horse", index: true },
    relationshipId: { type: Schema.Types.ObjectId, ref: "Relationship" },
    bookingId: { type: Schema.Types.ObjectId, ref: "Booking" },
    invoiceId: { type: Schema.Types.ObjectId, ref: "Invoice" },

    actionUrl: { type: String },
    metadata: { type: Schema.Types.Mixed, default: undefined },

    readByUserIds: {
      type: [{ type: Schema.Types.ObjectId, ref: "User" }],
      default: undefined,
    },
  },
  {
    timestamps: true,
    trim: true,
  }
);

notificationSchema.index({ recipientUserIds: 1, createdAt: -1 });
notificationSchema.index({ notificationType: 1, createdAt: -1 });

const Notification =
  mongoose.models.Notification || model("Notification", notificationSchema);
export default Notification;
