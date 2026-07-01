/**
 * GET /api/v1/horses/:id/ownership-transfers — outbound pending transfers for main owner.
 */

import { describe, expect, it } from "vitest";
import Horse from "@/models/Horse.ts";
import { AUTH_CONFIG } from "@/lib/auth/config.ts";
import * as authService from "@/lib/services/authService.ts";
import * as ownershipTransferService from "@/lib/services/ownershipTransferService.ts";
import { GET } from "@/app/api/v1/horses/[id]/ownership-transfers/route.ts";

async function registerUser(email: string) {
  return authService.register({
    email,
    password: "TestPass1!",
    firstName: "Test",
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

describe("GET /api/v1/horses/:id/ownership-transfers", () => {
  it("lists pending transfers sent by the main owner", async () => {
    const main = await registerUser("hub-ot-main@example.com");
    const buyer = await registerUser("hub-ot-buyer@example.com");
    const horse = await createHorse(main.user.id, "Hub Horse");

    await ownershipTransferService.createOwnershipTransfer(main.user.id, {
      entityType: "horse",
      entityId: String(horse._id),
      transferKind: "transfer_main",
      receiverUserId: buyer.user.id,
    });

    const request = new Request(
      `http://localhost:3000/api/v1/horses/${horse._id}/ownership-transfers?status=pending`,
      {
        headers: {
          Cookie: `${AUTH_CONFIG.ACCESS_COOKIE_NAME}=${main.accessToken}`,
        },
      },
    );

    const response = await GET(request, {
      params: Promise.resolve({ id: String(horse._id) }),
    });

    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body.data.transfers).toHaveLength(1);
    expect(body.data.transfers[0].transferKind).toBe("transfer_main");
  });

  it("returns 403 for co-owners who are not main owner", async () => {
    const main = await registerUser("hub-ot-co-main@example.com");
    const partner = await registerUser("hub-ot-co-partner@example.com");
    const horse = await Horse.create({
      name: "Shared Hub Horse",
      breed: "Thoroughbred",
      sex: "Mare",
      mainOwnerUserId: main.user.id,
      createdByUserId: main.user.id,
      coOwners: [{ userId: partner.user.id, ownershipPercentage: 40 }],
    });

    const request = new Request(
      `http://localhost:3000/api/v1/horses/${horse._id}/ownership-transfers?status=pending`,
      {
        headers: {
          Cookie: `${AUTH_CONFIG.ACCESS_COOKIE_NAME}=${partner.accessToken}`,
        },
      },
    );

    const response = await GET(request, {
      params: Promise.resolve({ id: String(horse._id) }),
    });

    expect(response.status).toBe(403);
  });
});
