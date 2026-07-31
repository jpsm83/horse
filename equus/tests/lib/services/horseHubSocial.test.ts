import { describe, expect, it } from "vitest";
import mongoose from "mongoose";

import * as horseService from "@/lib/services/horseService.ts";
import * as planningService from "@/lib/services/horsePlanningService.ts";
import * as userService from "@/lib/services/userService.ts";
import Horse from "@/models/Horse.ts";
import HorseEvent from "@/models/HorseEvent.ts";
import Media from "@/models/Media.ts";
import Relationship from "@/models/Relationship.ts";
import connectDb from "@/lib/db.ts";

async function createUser(email: string) {
  return userService.createCredentialsUser({
    email,
    password: "TestPass1!",
    firstName: "Hub",
  });
}

describe("getHorseHubSocial", () => {
  it("includes gallery planning and connections when Layer 2 allows", async () => {
    await connectDb();
    const owner = await createUser(`hub-social-${Date.now()}@example.com`);
    const horse = await horseService.createHorse(String(owner._id), {
      name: "Social Hub",
      breed: "Lusitano",
      sex: "Gelding",
      countryOfBirth: "US",
    });
    const horseId = String(horse._id);

    await Horse.findByIdAndUpdate(horse._id, {
      $set: { "hubSections.connections.mode": "public" },
    });

    await Media.create({
      horseId: horse._id,
      uploadedByUserId: owner._id,
      type: "image",
      url: "https://example.com/hub.jpg",
      isVisibleOnHub: true,
      visibilityMode: "public",
      isActive: true,
    });

    await HorseEvent.create({
      horseId: horse._id,
      createdByUserId: owner._id,
      eventType: "training",
      title: "Morning school",
      startDate: new Date(Date.now() + 86_400_000),
      visibilityMode: "public",
      isActive: true,
    });

    await Relationship.create({
      horseId: horse._id,
      relationshipType: "stable",
      status: "accepted",
      requesterUserId: owner._id,
      receiverAccountType: "stable",
      receiverAccountId: new mongoose.Types.ObjectId(),
      historicalReference: { receiverLabel: "Sunrise Stable" },
      requestedAt: new Date(),
      respondedAt: new Date(),
    });

    const social = await horseService.getHorseHubSocial(horseId);
    expect(social.sections.gallery?.length).toBe(1);
    expect(social.sections.planning?.length).toBe(1);
    expect(social.sections.connections?.[0]?.displayName).toBe("Sunrise Stable");

    // Shared view stays slim — no social lists even when data exists
    const view = await horseService.getHorseView(horseId);
    expect(view.horse.sections.gallery).toBeUndefined();
    expect(view.horse.sections.planning).toBeUndefined();
    expect(view.horse.sections.connections).toBeUndefined();
    expect(view.viewerRole).toBe("guest");
    expect(view.allowedTabs).toContain("hub");
    expect(view.allowedTabs).not.toContain("admin");
  });

  it("omits gallery when Layer 2 gallery is owner-only for guests", async () => {
    await connectDb();
    const owner = await createUser(`hub-gallery-hide-${Date.now()}@example.com`);
    const horse = await horseService.createHorse(String(owner._id), {
      name: "Hidden Gallery",
      breed: "Lusitano",
      sex: "Mare",
      countryOfBirth: "US",
    });
    await Horse.findByIdAndUpdate(horse._id, {
      $set: { "hubSections.gallery.mode": "owner" },
    });

    await Media.create({
      horseId: horse._id,
      uploadedByUserId: owner._id,
      type: "image",
      url: "https://example.com/secret.jpg",
      isVisibleOnHub: true,
      visibilityMode: "public",
      isActive: true,
    });

    const social = await horseService.getHorseHubSocial(String(horse._id));
    expect(social.sections.gallery).toBeUndefined();

    const view = await horseService.getHorseView(String(horse._id));
    expect(view.horse.sections.gallery).toBeUndefined();
  });
});

describe("listPlanning visibility", () => {
  it("returns empty for guests when Layer 2 planning is owner-only", async () => {
    await connectDb();
    const owner = await createUser(`plan-l2-${Date.now()}@example.com`);
    const horse = await horseService.createHorse(String(owner._id), {
      name: "Plan Horse",
      breed: "Arabian",
      sex: "Stallion",
      countryOfBirth: "US",
    });
    await Horse.findByIdAndUpdate(horse._id, {
      $set: { "hubSections.planning.mode": "owner" },
    });

    await HorseEvent.create({
      horseId: horse._id,
      createdByUserId: owner._id,
      eventType: "appointment",
      title: "Vet",
      startDate: new Date(),
      visibilityMode: "public",
      isActive: true,
    });

    const events = await planningService.listPlanning(String(horse._id));
    expect(events).toHaveLength(0);

    const ownerEvents = await planningService.listPlanning(String(horse._id), undefined, undefined, {
      id: String(owner._id),
    });
    expect(ownerEvents).toHaveLength(1);
  });
});
