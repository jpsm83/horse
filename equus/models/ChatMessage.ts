/**
 * ChatMessage — text message in a 1:1 ChatThread.
 */

import mongoose, { Schema, model } from "mongoose";

const chatMessageSchema = new Schema(
  {
    threadId: {
      type: Schema.Types.ObjectId,
      ref: "ChatThread",
      required: true,
      index: true,
    },
    senderUserId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    body: { type: String, required: true, maxlength: 4000 },
    contextPrefix: { type: String, maxlength: 500 },
    readByUserIds: { type: [Schema.Types.ObjectId], ref: "User", default: undefined },
  },
  { timestamps: true },
);

chatMessageSchema.index({ threadId: 1, createdAt: -1 });

const ChatMessage = mongoose.models.ChatMessage || model("ChatMessage", chatMessageSchema);
export default ChatMessage;
