import { Schema, model, models } from "mongoose";

import { roles } from "@/lib/constants";

export const userSchema = new Schema(
  {
    username: {
      type: String,
      required: [true, "Username is required!"],
      trim: true,
      minlength: [5, "Username must be at least 5 characters long"],
      maxlength: [30, "Username cannot exceed 30 characters"],
      match: [
        /^[a-zA-Z0-9_\-\s]+$/,
        "Username can only contain letters, numbers, underscores, dashes and spaces",
      ],
    },
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
    password: {
      type: String,
      required: [true, "Password is required!"],
    },
    role: { type: String, enum: roles, default: "user" },
    birthDate: {
      type: Date,
      required: true,
    },
    imageFile: {
      type: String,
    },
    imageUrl: {
      type: String,
    },
    preferences: {
      language: { type: String, required: true },
      region: { type: String, required: true },
    },
    likedArticles: {
      type: [{ type: Schema.Types.ObjectId, ref: "Articles" }],
      default: undefined,
    },
    commentedArticles: {
      type: [{ type: Schema.Types.ObjectId, ref: "Articles" }],
      default: undefined,
    },
    subscriptionId: {
      type: Schema.Types.ObjectId,
      ref: "Subscriber",
      default: null,
    },
    readingHistory: {
      type: [
        {
          articlesId: {
            type: Schema.Types.ObjectId,
            ref: "Articles",
            required: true,
          },
          readAt: { type: Date, default: Date.now },
        },
      ],
      default: undefined,
    },
    lastLogin: { type: Date, required: true },
    isActive: { type: Boolean, default: true },
    emailVerified: { type: Boolean, default: false },
    verificationToken: { type: String },
    resetPasswordToken: { type: String },
    resetPasswordExpires: { type: Date },
  },
  {
    timestamps: true,
    trim: true,
  }
);

const User = models.User || model("User", userSchema);
export default User;
