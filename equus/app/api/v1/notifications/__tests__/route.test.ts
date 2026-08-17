/**
 * Notifications REST routes — inbox list + mark-as-read contract.
 */

import { describe, expect, it } from "vitest";

import Notification from "@/models/Notification.ts";
import * as authService from "@/lib/services/authService.ts";
import { GET } from "@/app/api/v1/notifications/route.ts";
import { PATCH } from "@/app/api/v1/notifications/[id]/read/route.ts";

function authHeaders(accessToken: string) {
  return { Authorization: `Bearer ${accessToken}` };
}

async function registerUser(email: string) {
  return authService.register({
    email,
    password: "TestPass1!",
  });
}

describe("notifications API", () => {
  it("GET returns an empty inbox when no notifications target the user", async () => {
    const user = await registerUser("api-notif-empty@example.com");

    const request = new Request("http://localhost:3000/api/v1/notifications", {
      headers: authHeaders(user.accessToken),
    });

    const response = await GET(request);
    expect(response.status).toBe(200);

    const body = await response.json();
    expect(body.data.notifications).toEqual([]);
    expect(body.data.total).toBe(0);
  });

  it("GET returns only notifications targeting the user", async () => {
    const user = await registerUser("api-notif-list@example.com");
    const other = await registerUser("api-notif-other@example.com");

    await Notification.create([
      {
        recipientUserIds: [user.user.id],
        notificationType: "relationship",
        title: "Mine",
        message: "Hello",
      },
      {
        recipientUserIds: [other.user.id],
        notificationType: "system",
        title: "Not mine",
        message: "Bye",
      },
    ]);

    const request = new Request("http://localhost:3000/api/v1/notifications", {
      headers: authHeaders(user.accessToken),
    });

    const response = await GET(request);
    const body = await response.json();
    expect(response.status).toBe(200);
    expect(body.data.total).toBe(1);
    expect(body.data.notifications[0]!.title).toBe("Mine");
  });

  it("PATCH marks a notification as read and is idempotent", async () => {
    const user = await registerUser("api-notif-read@example.com");

    const created = await Notification.create({
      recipientUserIds: [user.user.id],
      notificationType: "system",
      title: "T",
      message: "M",
    });

    const patchRequest = new Request(
      `http://localhost:3000/api/v1/notifications/${created.id}/read`,
      { method: "PATCH", headers: authHeaders(user.accessToken) },
    );

    const response = await PATCH(patchRequest, {
      params: Promise.resolve({ id: String(created._id) }),
    });
    expect(response.status).toBe(200);

    const doc = await Notification.findById(created._id).lean();
    expect(doc?.readByUserIds?.map(String)).toContain(user.user.id);
  });

  it("PATCH returns 404 for a notification not targeting the user", async () => {
    const user = await registerUser("api-notif-404@example.com");
    const other = await registerUser("api-notif-404-other@example.com");

    const created = await Notification.create({
      recipientUserIds: [other.user.id],
      notificationType: "system",
      title: "T",
      message: "M",
    });

    const patchRequest = new Request(
      `http://localhost:3000/api/v1/notifications/${created.id}/read`,
      { method: "PATCH", headers: authHeaders(user.accessToken) },
    );

    const response = await PATCH(patchRequest, {
      params: Promise.resolve({ id: String(created._id) }),
    });
    expect(response.status).toBe(404);
  });
});
