/**
 * Ownership transfer REST routes — UA-18 contract tests.
 */

import { describe, expect, it } from "vitest";
import Horse from "@/models/Horse.ts";
import { AUTH_CONFIG } from "@/lib/auth/config.ts";
import * as authService from "@/lib/services/authService.ts";
import { userOwnsEntity } from "@/lib/ownership/entityOwnership.ts";
import { POST } from "@/app/api/v1/ownership-transfers/route.ts";
import { PATCH, DELETE } from "@/app/api/v1/ownership-transfers/[id]/route.ts";
import { GET } from "@/app/api/v1/users/me/ownership-transfers/route.ts";

function authHeaders(accessToken: string) {
  return { Authorization: `Bearer ${accessToken}` };
}

async function registerUser(email: string, firstName = "Test") {
  return authService.register({
    email,
    password: "TestPass1!",
    firstName,
  });
}

async function createHorse(ownerId: string, name: string) {
  return Horse.create({
    name,
    breed: "Thoroughbred",
    sex: "Mare",
    mainOwnerUserId: ownerId,
    createdByUserId: ownerId,
  });
}

describe("ownership transfer API", () => {
  it("POST creates a pending transfer_main for the main owner", async () => {
    const main = await registerUser("api-ot-main@example.com");
    const buyer = await registerUser("api-ot-buyer@example.com");
    const horse = await createHorse(main.user.id, "API Handoff");

    const request = new Request("http://localhost:3000/api/v1/ownership-transfers", {
      method: "POST",
      headers: {
        ...authHeaders(main.accessToken),
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        entityType: "horse",
        entityId: horse.id,
        transferKind: "transfer_main",
        receiverUserId: buyer.user.id,
      }),
    });

    const response = await POST(request);
    expect(response.status).toBe(200);

    const body = await response.json();
    expect(body.data.transfer.status).toBe("pending");
    expect(body.data.transfer.transferKind).toBe("transfer_main");
    expect(body.data.transfer.entityId).toBe(horse.id);
  });

  it("GET lists pending transfers for the receiver inbox", async () => {
    const main = await registerUser("api-ot-inbox-main@example.com");
    const buyer = await registerUser("api-ot-inbox-buyer@example.com");
    const horse = await createHorse(main.user.id, "Inbox Horse");

    const createRequest = new Request("http://localhost:3000/api/v1/ownership-transfers", {
      method: "POST",
      headers: {
        ...authHeaders(main.accessToken),
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        entityType: "horse",
        entityId: horse.id,
        transferKind: "transfer_main",
        receiverUserId: buyer.user.id,
      }),
    });
    await POST(createRequest);

    const listRequest = new Request(
      "http://localhost:3000/api/v1/users/me/ownership-transfers?status=pending",
      { headers: authHeaders(buyer.accessToken) },
    );

    const response = await GET(listRequest);
    expect(response.status).toBe(200);

    const body = await response.json();
    expect(body.data.transfers).toHaveLength(1);
    expect(body.data.transfers[0].entityId).toBe(horse.id);
    expect(body.data.transfers[0].status).toBe("pending");
  });

  it("PATCH accept applies transfer_main and former main loses access", async () => {
    const main = await registerUser("api-ot-accept-main@example.com");
    const buyer = await registerUser("api-ot-accept-buyer@example.com");
    const horse = await createHorse(main.user.id, "Accept Horse");

    const createResponse = await POST(
      new Request("http://localhost:3000/api/v1/ownership-transfers", {
        method: "POST",
        headers: {
          ...authHeaders(main.accessToken),
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          entityType: "horse",
          entityId: horse.id,
          transferKind: "transfer_main",
          receiverUserId: buyer.user.id,
        }),
      }),
    );
    const { data: createData } = await createResponse.json();
    const transferId = createData.transfer.id;

    const acceptResponse = await PATCH(
      new Request(`http://localhost:3000/api/v1/ownership-transfers/${transferId}`, {
        method: "PATCH",
        headers: {
          ...authHeaders(buyer.accessToken),
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ status: "accepted" }),
      }),
      { params: Promise.resolve({ id: transferId }) },
    );

    expect(acceptResponse.status).toBe(200);
    const { data: acceptData } = await acceptResponse.json();
    expect(acceptData.transfer.status).toBe("accepted");

    const reloaded = await Horse.findById(horse.id).lean();
    expect(String(reloaded?.mainOwnerUserId)).toBe(buyer.user.id);
    expect(userOwnsEntity(main.user.id, reloaded as Record<string, unknown>)).toBe(false);
    expect(userOwnsEntity(buyer.user.id, reloaded as Record<string, unknown>)).toBe(true);
  });

  it("PATCH decline leaves entity ownership unchanged", async () => {
    const main = await registerUser("api-ot-decline-main@example.com");
    const buyer = await registerUser("api-ot-decline-buyer@example.com");
    const horse = await createHorse(main.user.id, "Decline Horse");

    const createResponse = await POST(
      new Request("http://localhost:3000/api/v1/ownership-transfers", {
        method: "POST",
        headers: {
          ...authHeaders(main.accessToken),
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          entityType: "horse",
          entityId: horse.id,
          transferKind: "transfer_main",
          receiverUserId: buyer.user.id,
        }),
      }),
    );
    const { data: createData } = await createResponse.json();
    const transferId = createData.transfer.id;

    const declineResponse = await PATCH(
      new Request(`http://localhost:3000/api/v1/ownership-transfers/${transferId}`, {
        method: "PATCH",
        headers: {
          ...authHeaders(buyer.accessToken),
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ status: "declined" }),
      }),
      { params: Promise.resolve({ id: transferId }) },
    );

    expect(declineResponse.status).toBe(200);
    const reloaded = await Horse.findById(horse.id).lean();
    expect(String(reloaded?.mainOwnerUserId)).toBe(main.user.id);
  });

  it("DELETE cancels a pending transfer for the initiator", async () => {
    const main = await registerUser("api-ot-cancel-main@example.com");
    const buyer = await registerUser("api-ot-cancel-buyer@example.com");
    const horse = await createHorse(main.user.id, "Cancel Horse");

    const createResponse = await POST(
      new Request("http://localhost:3000/api/v1/ownership-transfers", {
        method: "POST",
        headers: {
          ...authHeaders(main.accessToken),
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          entityType: "horse",
          entityId: horse.id,
          transferKind: "transfer_main",
          receiverUserId: buyer.user.id,
        }),
      }),
    );
    const { data: createData } = await createResponse.json();
    const transferId = createData.transfer.id;

    const cancelResponse = await DELETE(
      new Request(`http://localhost:3000/api/v1/ownership-transfers/${transferId}`, {
        method: "DELETE",
        headers: authHeaders(main.accessToken),
      }),
      { params: Promise.resolve({ id: transferId }) },
    );

    expect(cancelResponse.status).toBe(200);
    const { data: cancelData } = await cancelResponse.json();
    expect(cancelData.transfer.status).toBe("cancelled");

    const listResponse = await GET(
      new Request(
        "http://localhost:3000/api/v1/users/me/ownership-transfers?status=pending",
        { headers: authHeaders(buyer.accessToken) },
      ),
    );
    const { data: listData } = await listResponse.json();
    expect(listData.transfers).toHaveLength(0);
  });

  it("POST without auth returns 401", async () => {
    const request = new Request("http://localhost:3000/api/v1/ownership-transfers", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        entityType: "horse",
        entityId: "507f1f77bcf86cd799439011",
        transferKind: "transfer_main",
        receiverUserId: "507f1f77bcf86cd799439012",
      }),
    });

    const response = await POST(request);
    expect(response.status).toBe(401);
  });

  it("accepts cookie auth for web clients", async () => {
    const main = await registerUser("api-ot-cookie-main@example.com");
    const buyer = await registerUser("api-ot-cookie-buyer@example.com");
    const horse = await createHorse(main.user.id, "Cookie Horse");

    const request = new Request("http://localhost:3000/api/v1/ownership-transfers", {
      method: "POST",
      headers: {
        Cookie: `${AUTH_CONFIG.ACCESS_COOKIE_NAME}=${main.accessToken}; ${AUTH_CONFIG.REFRESH_COOKIE_NAME}=${main.refreshToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        entityType: "horse",
        entityId: horse.id,
        transferKind: "transfer_main",
        receiverUserId: buyer.user.id,
      }),
    });

    const response = await POST(request);
    expect(response.status).toBe(200);
  });
});
