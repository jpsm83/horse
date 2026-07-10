import { Schema, model, models } from "mongoose";

import { mainCategories, newsletterFrequencies } from "@/lib/constants";

export const subscriberSchema = new Schema(
  {
    email: {
      type: String,
      required: [true, "Email is required!"],
      unique: true,
      match: [
        /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
        "Please enter a valid email address!",
      ],
      lowercase: true,
      trim: true,
    },
    emailVerified: {
      type: Boolean,
      default: false,
    },
    verificationToken: {
      type: String,
      required: false, // Make it optional so we can clear it after confirmation
    },
    unsubscribeToken: {
      type: String,
      required: true,
    },
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
    },
    subscriptionPreferences: {
      categories: {
        type: [String],
        enum: mainCategories,
        default: mainCategories, // Subscribe to all categories by default
      },
      subscriptionFrequencies: {
        type: String,
        enum: newsletterFrequencies,
        default: "weekly", // Default to weekly
      },
    },
  },
  {
    timestamps: true,
    trim: true,
  }
);

const Subscriber = models.Subscriber || model("Subscriber", subscriberSchema);
export default Subscriber;
