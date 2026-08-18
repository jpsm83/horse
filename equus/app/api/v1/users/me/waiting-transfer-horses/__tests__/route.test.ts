/**
 * Waiting-transfer horses inbox API — home action rows.
 */

import { describe, expect, it } from "vitest";

import * as authService from "@/lib/services/authService.ts";
import * as horseService from "@/lib/services/horseService.ts";
import { createTestStable } from "@/models/__tests__/helpers/businessRoleFixtures.ts";
import { GET } from "@/app/api/v1/users/me/waiting-transfer-horses/route.ts";

function authHeaders(accessToken: string) {
  return { Authorization: `Bearer ${accessToken}` };
}

describe("GET /api/v1/users/me/waiting-transfer-horses", () => {
  it("returns provisional owner and invited owner rows", async () => {
    const stableOwner = await authService.register({
      email: "wt-api-stable@example.com",
      password: "TestPass1!",
      firstName: "Stable",
    });
    const invitedOwner = await authService.register({
      email: "wt-api-invited@example.com",
      password: "TestPass1!",
      firstName: "Invited",
    });

    const stable = await createTestStable(stableOwner.user.id);

    const horse = await horseService.createHorse(stableOwner.user.id, {
      name: "Waiting Star",
      breed: "Thoroughbred",
      sex: "Mare",
      countryOfBirth: "US",
      waitingTransfer: {
        invitedOwnerEmail: "wt-api-invited@example.com",
        hostStableId: String(stable._id),
      },
    });

    const provisionalRequest = new Request(
      "http://localhost:3000/api/v1/users/me/waiting-transfer-horses",
      { headers: authHeaders(stableOwner.accessToken) },
    );
    const provisionalResponse = await GET(provisionalRequest);
    expect(provisionalResponse.status).toBe(200);
    const provisionalBody = await provisionalResponse.json();
    expect(provisionalBody.data.horses).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          horseId: String(horse._id),
          horseName: "Waiting Star",
          role: "provisional_owner",
          invitedOwnerEmail: "wt-api-invited@example.com",
        }),
      ]),
    );

    const invitedRequest = new Request(
      "http://localhost:3000/api/v1/users/me/waiting-transfer-horses",
      { headers: authHeaders(invitedOwner.accessToken) },
    );
    const invitedResponse = await GET(invitedRequest);
    expect(invitedResponse.status).toBe(200);
    const invitedBody = await invitedResponse.json();
    expect(invitedBody.data.horses).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          horseId: String(horse._id),
          horseName: "Waiting Star",
          role: "invited_owner",
        }),
      ]),
    );
  });
});
