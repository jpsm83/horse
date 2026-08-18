import { describe, expect, it } from "vitest";
import mongoose from "mongoose";

import User from "@/models/User.ts";
import { ApiError } from "@/lib/api/errors.ts";
import * as chatService from "@/lib/services/chatService.ts";
import * as userService from "@/lib/services/userService.ts";

async function createUser(email: string) {
  return userService.createCredentialsUser({
    email,
    password: "TestPass1!",
    firstName: "Chat",
  });
}

async function setDmPreference(userId: string, allowDirectMessagesFrom: string) {
  await User.findByIdAndUpdate(userId, {
    $set: { "preferences.allowDirectMessagesFrom": allowDirectMessagesFrom },
  });
}

async function blockUser(blockerId: string, blockedId: string) {
  await User.findByIdAndUpdate(blockerId, {
    $push: {
      blocks: {
        blockedUserId: new mongoose.Types.ObjectId(blockedId),
        createdAt: new Date(),
      },
    },
  });
}

describe("chatService", () => {
  it("finds or creates a thread between two users", async () => {
    const sender = await createUser("chat-thread-sender@example.com");
    const target = await createUser("chat-thread-target@example.com");
    await setDmPreference(String(target._id), "everyone");

    const first = await chatService.findOrCreateThread(String(sender._id), String(target._id));
    expect(first.created).toBe(true);
    expect(first.thread.participantUserIds).toHaveLength(2);
    expect(first.thread.otherUserId).toBe(String(target._id));

    const second = await chatService.findOrCreateThread(String(sender._id), String(target._id));
    expect(second.created).toBe(false);
    expect(second.thread.id).toBe(first.thread.id);
  });

  it("sends a message and lists it in the thread", async () => {
    const sender = await createUser("chat-send-sender@example.com");
    const target = await createUser("chat-send-target@example.com");
    await setDmPreference(String(target._id), "everyone");

    const { thread } = await chatService.findOrCreateThread(String(sender._id), String(target._id));
    const sent = await chatService.sendMessage(thread.id, String(sender._id), {
      body: "Hello there",
    });

    expect(sent.message.body).toBe("Hello there");
    expect(sent.message.senderUserId).toBe(String(sender._id));

    const listed = await chatService.listMessages(thread.id, String(sender._id));
    expect(listed.messages).toHaveLength(1);
    expect(listed.messages[0]?.body).toBe("Hello there");
  });

  it("includes contextPrefix on the first message only", async () => {
    const sender = await createUser("chat-context-sender@example.com");
    const target = await createUser("chat-context-target@example.com");
    await setDmPreference(String(target._id), "everyone");

    const result = await chatService.findOrCreateThread(String(sender._id), String(target._id), {
      contextPrefix: "Re: Vaccination appt",
      initialBody: "Can we reschedule?",
    });

    expect(result.message?.contextPrefix).toBe("Re: Vaccination appt");

    const followUp = await chatService.sendMessage(result.thread.id, String(sender._id), {
      body: "Thanks",
      contextPrefix: "Should be ignored",
    });
    expect(followUp.message.contextPrefix).toBeUndefined();
  });

  it("lists threads sorted by last message activity", async () => {
    const alice = await createUser("chat-list-alice@example.com");
    const bob = await createUser("chat-list-bob@example.com");
    const carol = await createUser("chat-list-carol@example.com");
    await setDmPreference(String(bob._id), "everyone");
    await setDmPreference(String(carol._id), "everyone");

    const bobThread = await chatService.findOrCreateThread(String(alice._id), String(bob._id));
    await chatService.findOrCreateThread(String(alice._id), String(carol._id));
    await chatService.sendMessage(bobThread.thread.id, String(alice._id), { body: "Latest" });

    const listed = await chatService.listThreads(String(alice._id));
    expect(listed.threads[0]?.otherUserId).toBe(String(bob._id));
  });

  it("denies send when either user blocked the other", async () => {
    const sender = await createUser("chat-block-sender@example.com");
    const target = await createUser("chat-block-target@example.com");
    await setDmPreference(String(target._id), "everyone");

    const { thread } = await chatService.findOrCreateThread(String(sender._id), String(target._id));
    await blockUser(String(target._id), String(sender._id));

    await expect(
      chatService.sendMessage(thread.id, String(sender._id), { body: "Blocked" }),
    ).rejects.toBeInstanceOf(ApiError);
  });

  it("marks messages read for the viewer", async () => {
    const sender = await createUser("chat-read-sender@example.com");
    const target = await createUser("chat-read-target@example.com");
    await setDmPreference(String(target._id), "everyone");

    const { thread } = await chatService.findOrCreateThread(String(sender._id), String(target._id));
    await chatService.sendMessage(thread.id, String(sender._id), { body: "Unread" });

    await chatService.markThreadRead(thread.id, String(target._id));
    const listed = await chatService.listMessages(thread.id, String(target._id));
    expect(listed.messages[0]?.readByUserIds).toContain(String(target._id));
  });
});
