/**
 * PATCH /api/v1/horses/:id/media/:mediaId/visibility — Hub gallery visibility toggle.
 */

import { describe, expect, it } from "vitest";
import Media from "@/models/Media.ts";
import * as authService from "@/lib/services/authService.ts";
import * as horseService from "@/lib/services/horseService.ts";
import { PATCH } from "@/app/api/v1/horses/[id]/media/[mediaId]/visibility/route.ts";

function authHeaders(accessToken: string) {
  return {
    Authorization: `Bearer ${accessToken}`,
    "Content-Type": "application/json",
  };
}

describe("PATCH /api/v1/horses/:id/media/:mediaId/visibility", () => {
  it("updates isVisibleOnHub for the horse owner", async () => {
    const owner = await authService.register({
      email: "media-vis-owner@example.com",
      password: "TestPass1!",
    });

    const horse = await horseService.createHorse(owner.user.id, {
      name: "Visibility Horse",
      breed: "Arabian",
      sex: "Mare",
      countryOfBirth: "PT",
    });

    const media = await Media.create({
      horseId: horse._id,
      uploadedByUserId: owner.user.id,
      type: "image",
      url: "https://example.com/vis.jpg",
      isVisibleOnHub: true,
    });

    const request = new Request(
      `http://localhost:3000/api/v1/horses/${horse._id}/media/${media._id}/visibility`,
      {
        method: "PATCH",
        headers: authHeaders(owner.accessToken),
        body: JSON.stringify({ isVisibleOnHub: false }),
      },
    );

    const response = await PATCH(request, {
      params: Promise.resolve({
        id: String(horse._id),
        mediaId: String(media._id),
      }),
    });

    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body.data.media.isVisibleOnHub).toBe(false);

    const stored = await Media.findById(media._id).lean();
    expect(stored?.isVisibleOnHub).toBe(false);
  });

  it("returns 404 when the viewer is not on the ownership team", async () => {
    const owner = await authService.register({
      email: "media-vis-main@example.com",
      password: "TestPass1!",
    });
    const stranger = await authService.register({
      email: "media-vis-stranger@example.com",
      password: "TestPass1!",
    });

    const horse = await horseService.createHorse(owner.user.id, {
      name: "Protected Horse",
      breed: "Thoroughbred",
      sex: "Gelding",
      countryOfBirth: "PT",
    });

    const media = await Media.create({
      horseId: horse._id,
      uploadedByUserId: owner.user.id,
      type: "image",
      url: "https://example.com/protected.jpg",
      isVisibleOnHub: true,
    });

    const request = new Request(
      `http://localhost:3000/api/v1/horses/${horse._id}/media/${media._id}/visibility`,
      {
        method: "PATCH",
        headers: authHeaders(stranger.accessToken),
        body: JSON.stringify({ isVisibleOnHub: false }),
      },
    );

    const response = await PATCH(request, {
      params: Promise.resolve({
        id: String(horse._id),
        mediaId: String(media._id),
      }),
    });

    expect(response.status).toBe(404);
  });
});
