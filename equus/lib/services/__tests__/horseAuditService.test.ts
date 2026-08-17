/**
 * horseAuditService — audit log write + owner-team read for History tab.
 */

import { describe, expect, it } from "vitest";
import mongoose from "mongoose";
import Horse from "@/models/Horse.ts";
import HorseAuditLog from "@/models/HorseAuditLog.ts";
import User from "@/models/User.ts";
import { ApiError } from "@/lib/api/errors.ts";
import { listAuditLogs, recordAudit } from "@/lib/services/horseAuditService.ts";
import connectDb from "@/lib/db.ts";

async function createUser(emailSuffix: string) {
  return User.create({
    personalDetails: {
      email: `audit-${emailSuffix}-${Date.now()}-${Math.random()}@example.com`,
      password: "hash",
      username: `audit_${emailSuffix}`,
    },
    authProvider: "credentials",
  });
}

async function createHorse(ownerId: mongoose.Types.ObjectId) {
  return Horse.create({
    mainOwnerUserId: ownerId,
    createdByUserId: ownerId,
    name: "Audit Test Horse",
    breed: "Arabian",
    sex: "Mare",
    profileVisibility: "public",
  });
}

describe("horseAuditService", () => {
  it("records audit entries with resolved owner source type", async () => {
    await connectDb();
    const owner = await createUser("owner");
    const horse = await createHorse(owner._id);

    await recordAudit({
      horseId: String(horse._id),
      actorId: String(owner._id),
      actionType: "horse.updated",
      description: "Updated visibility",
    });

    const stored = await HorseAuditLog.findOne({ horseId: horse._id }).lean();
    expect(stored?.sourceType).toBe("owner");
    expect(stored?.actionType).toBe("horse.updated");
  });

  it("lists audit logs for owner-team members including responsibles", async () => {
    await connectDb();
    const owner = await createUser("main");
    const responsible = await createUser("responsible");
    const horse = await createHorse(owner._id);
    await Horse.findByIdAndUpdate(horse._id, {
      $push: {
        responsibles: { userId: responsible._id, joinedAt: new Date() },
      },
    });

    await HorseAuditLog.create({
      horseId: horse._id,
      actorId: owner._id,
      actorLabel: "Main Owner",
      sourceType: "owner",
      actionType: "event.created",
      description: "Event scheduled",
    });

    const logs = await listAuditLogs(String(responsible._id), String(horse._id));
    expect(logs).toHaveLength(1);
    expect(logs[0]?.actionType).toBe("event.created");
    expect(logs[0]?.userUsername).toBe("audit_main");
  });

  it("rejects audit log reads from non-owner-team viewers", async () => {
    await connectDb();
    const owner = await createUser("blocked-main");
    const stranger = await createUser("blocked-stranger");
    const horse = await createHorse(owner._id);

    await expect(listAuditLogs(String(stranger._id), String(horse._id))).rejects.toBeInstanceOf(
      ApiError,
    );
  });
});
