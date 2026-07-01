import mongoose, { Schema, model } from "mongoose";
import { deactivationAuditFields } from "./sharedSchemas/deactivationAudit.ts";
import * as enums from "../utils/enums.ts";

const { invoiceStatusEnums, expenseCategoryEnums, accountTypeEnums, currencyEnums } = enums;

const invoiceLineItemSchema = new Schema(
  {
    description: { type: String, required: true },
    category: { type: String, enum: expenseCategoryEnums, default: "other" },
    quantity: { type: Number, min: 0, default: 1 },
    unitPrice: { type: Number, min: 0, required: true },
    totalPrice: { type: Number, min: 0, required: true },
  },
  { _id: true }
);

const invoiceSchema = new Schema(
  {
    horseId: {
      type: Schema.Types.ObjectId,
      ref: "Horse",
      required: [true, "Horse id is required!"],
      index: true,
    },

    ownerUserId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: [true, "Owner user id is required!"],
      index: true,
    },

    issuerAccountType: {
      type: String,
      enum: accountTypeEnums,
      required: [true, "Issuer account type is required!"],
    },
    issuerAccountId: {
      type: Schema.Types.ObjectId,
      required: [true, "Issuer account id is required!"],
      index: true,
    },
    issuedByUserId: { type: Schema.Types.ObjectId, ref: "User", required: true },

    invoiceNumber: { type: String, required: true, unique: true },
    title: { type: String, required: true },
    notes: { type: String },

    lineItems: {
      type: [invoiceLineItemSchema],
      required: [true, "At least one line item is required!"],
      validate: {
        validator: (v: unknown[]) => Array.isArray(v) && v.length > 0,
        message: "Invoice must contain at least one line item.",
      },
    },

    subtotalAmount: { type: Number, min: 0, required: true },
    taxAmount: { type: Number, min: 0, default: 0 },
    totalAmount: { type: Number, min: 0, required: true },
    currency: { type: String, enum: currencyEnums, default: "USD" },

    status: {
      type: String,
      enum: invoiceStatusEnums,
      default: "draft",
      index: true,
    },

    issueDate: { type: Date, default: Date.now },
    dueDate: { type: Date },
    paidAt: { type: Date },

    relationshipId: { type: Schema.Types.ObjectId, ref: "Relationship" },
    bookingId: { type: Schema.Types.ObjectId, ref: "Booking" },

    ...deactivationAuditFields,
  },
  {
    timestamps: true,
    trim: true,
  }
);

invoiceSchema.index({ horseId: 1, ownerUserId: 1, status: 1 });
invoiceSchema.index({ issuerAccountType: 1, issuerAccountId: 1, createdAt: -1 });

const Invoice = mongoose.models.Invoice || model("Invoice", invoiceSchema);
export default Invoice;
