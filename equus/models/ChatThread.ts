/**
 * ChatThread — 1:1 conversation between two Users.
 *
 * `participantUserIds` is always a sorted pair of two ObjectIds for stable lookup.
 */

import mongoose, { Schema, model } from "mongoose";

const chatThreadSchema = new Schema(
  {
    participantUserIds: {
      type: [Schema.Types.ObjectId],
      ref: "User",
      required: true,
      validate: {
        validator(value: unknown[]) {
          return Array.isArray(value) && value.length === 2;
        },
        message: "Thread must have exactly two participants",
      },
    },
    lastMessageAt: { type: Date, index: true },
    lastMessagePreview: { type: String, maxlength: 200 },
  },
  { timestamps: true },
);

chatThreadSchema.index({ participantUserIds: 1 });

const ChatThread = mongoose.models.ChatThread || model("ChatThread", chatThreadSchema);
export default ChatThread;
