/**
 * Chat threads API route tests.
 */

import { describe, expect, it } from "vitest";

import * as authService from "@/lib/services/authService.ts";
import { GET, POST } from "@/app/api/v1/chat/threads/route.ts";
import { GET as GET_MESSAGES, POST as POST_MESSAGE } from "@/app/api/v1/chat/threads/[id]/messages/route.ts";
import User from "@/models/User.ts";

function authHeaders(accessToken: string) {
  return {
    Authorization: `Bearer ${accessToken}`,
    "Content-Type": "application/json",
  };
}

async function setEveryone(userId: string) {
  await User.findByIdAndUpdate(userId, {
    $set: { "preferences.allowDirectMessagesFrom": "everyone" },
  });
}

describe("/api/v1/chat/threads", () => {
  it("creates a thread and exchanges messages", async () => {
    const alice = await authService.register({
      email: "chat-api-alice@example.com",
      password: "TestPass1!",
      firstName: "Alice",
    });
    const bob = await authService.register({
      email: "chat-api-bob@example.com",
      password: "TestPass1!",
      firstName: "Bob",
    });
    await setEveryone(bob.user.id);

    const createResponse = await POST(
      new Request("http://localhost:3000/api/v1/chat/threads", {
        method: "POST",
        headers: authHeaders(alice.accessToken),
        body: JSON.stringify({ targetUserId: bob.user.id }),
      }),
    );
    expect(createResponse.status).toBe(201);
    const createBody = await createResponse.json();
    const threadId = createBody.data.thread.id as string;

    const sendResponse = await POST_MESSAGE(
      new Request(`http://localhost:3000/api/v1/chat/threads/${threadId}/messages`, {
        method: "POST",
        headers: authHeaders(alice.accessToken),
        body: JSON.stringify({ body: "Hi Bob" }),
      }),
      { params: Promise.resolve({ id: threadId }) },
    );
    expect(sendResponse.status).toBe(201);

    const listResponse = await GET_MESSAGES(
      new Request(`http://localhost:3000/api/v1/chat/threads/${threadId}/messages`, {
        headers: authHeaders(bob.accessToken),
      }),
      { params: Promise.resolve({ id: threadId }) },
    );
    expect(listResponse.status).toBe(200);
    const listBody = await listResponse.json();
    expect(listBody.data.messages).toHaveLength(1);
    expect(listBody.data.messages[0].body).toBe("Hi Bob");
  });

  it("lists threads for the current user", async () => {
    const alice = await authService.register({
      email: "chat-api-list-alice@example.com",
      password: "TestPass1!",
      firstName: "Alice",
    });
    const bob = await authService.register({
      email: "chat-api-list-bob@example.com",
      password: "TestPass1!",
      firstName: "Bob",
    });
    await setEveryone(bob.user.id);

    await POST(
      new Request("http://localhost:3000/api/v1/chat/threads", {
        method: "POST",
        headers: authHeaders(alice.accessToken),
        body: JSON.stringify({ targetUserId: bob.user.id, initialBody: "Hello" }),
      }),
    );

    const listResponse = await GET(
      new Request("http://localhost:3000/api/v1/chat/threads", {
        headers: authHeaders(alice.accessToken),
      }),
    );
    expect(listResponse.status).toBe(200);
    const listBody = await listResponse.json();
    expect(listBody.data.threads).toHaveLength(1);
    expect(listBody.data.threads[0].otherUserId).toBe(bob.user.id);
  });
});
