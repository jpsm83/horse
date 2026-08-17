import { describe, expect, it, vi } from "vitest";
import mongoose from "mongoose";
import Horse from "@/models/Horse.ts";
import HorseEvent from "@/models/HorseEvent.ts";
import User from "@/models/User.ts";
import { ApiError } from "@/lib/api/errors.ts";
import * as planningService from "@/lib/services/horsePlanningService.ts";
import { createPlanningEventSchema } from "@/lib/validations/horsePlanningForms.ts";
import connectDb from "@/lib/db.ts";

vi.mock("@/lib/services/horseAuditService.ts", () => ({
  recordAudit: vi.fn().mockResolvedValue(undefined),
}));

async function createOwner() {
  return User.create({
    personalDetails: { email: `plan-${Date.now()}-${Math.random()}@example.com`, password: "hash" },
    authProvider: "credentials",
  });
}

async function createHorse(ownerId: mongoose.Types.ObjectId) {
  return Horse.create({
    mainOwnerUserId: ownerId,
    createdByUserId: ownerId,
    name: "Plan Test Horse",
    breed: "Arabian",
    sex: "Mare",
    profileVisibility: "public",
  });
}

describe("horsePlanningService", () => {
  it("creates an owner-team personal event without entity source fields", async () => {
    await connectDb();
    const owner = await createOwner();
    const horse = await createHorse(owner._id);

    const created = await planningService.createPlanningItem(String(owner._id), String(horse._id), {
      eventType: "training",
      title: "Morning ride",
      startDate: "2026-08-20T09:00",
    });

    expect(created.title).toBe("Morning ride");
    expect(created.eventType).toBe("training");
    expect(created.sourceEntityType).toBeUndefined();
    expect(created.sourceEntityId).toBeUndefined();

    const stored = await HorseEvent.findById(created.id).lean();
    expect(stored?.sourceEntityType).toBeUndefined();
    expect(stored?.sourceEntityId).toBeUndefined();
    expect(stored?.visibilityMode).toBe("public");
  });

  it("rejects create from non-owner team member", async () => {
    await connectDb();
    const owner = await createOwner();
    const stranger = await createOwner();
    const horse = await createHorse(owner._id);

    await expect(
      planningService.createPlanningItem(String(stranger._id), String(horse._id), {
        eventType: "appointment",
        title: "Blocked",
        startDate: "2026-08-20T10:00",
      }),
    ).rejects.toBeInstanceOf(ApiError);
  });

  it("rejects feeding at the API schema and strips entity source fields", () => {
    const feeding = createPlanningEventSchema.safeParse({
      eventType: "feeding",
      title: "Feed",
      startDate: "2026-08-20T08:00",
    });
    expect(feeding.success).toBe(false);

    const entitySourced = createPlanningEventSchema.safeParse({
      eventType: "appointment",
      title: "Stable care",
      startDate: "2026-08-20T08:00",
      sourceEntityType: "stable",
      sourceEntityId: new mongoose.Types.ObjectId().toHexString(),
    });
    expect(entitySourced.success).toBe(true);
    expect(entitySourced.data).not.toHaveProperty("sourceEntityType");
    expect(entitySourced.data).not.toHaveProperty("sourceEntityId");
  });

  it("lists events for owner team and hides from guests when L2 planning is owner-only", async () => {
    await connectDb();
    const owner = await createOwner();
    const horse = await createHorse(owner._id);
    await Horse.findByIdAndUpdate(horse._id, {
      $set: { "hubSections.planning.mode": "owner" },
    });

    await HorseEvent.create({
      horseId: horse._id,
      createdByUserId: owner._id,
      eventType: "appointment",
      title: "Vet visit",
      startDate: new Date("2026-08-21T14:00:00Z"),
      visibilityMode: "public",
      isActive: true,
    });

    const guestEvents = await planningService.listPlanning(String(horse._id));
    expect(guestEvents).toHaveLength(0);

    const ownerEvents = await planningService.listPlanning(
      String(horse._id),
      undefined,
      undefined,
      { id: String(owner._id) },
    );
    expect(ownerEvents).toHaveLength(1);
    expect(ownerEvents[0]?.title).toBe("Vet visit");
  });
});
