import Horse from "@/models/Horse.ts";
import mongoose from "mongoose";

describe("Horse waitingTransfer schema", () => {
  it("persists waitingTransfer subdocument", async () => {
    const ownerId = new mongoose.Types.ObjectId();
    const stableId = new mongoose.Types.ObjectId();
    const doc = await Horse.create({
      name: "Pending",
      breed: "Thoroughbred",
      sex: "Mare",
      mainOwnerUserId: ownerId,
      createdByUserId: ownerId,
      registration: { isActive: true },
      waitingTransfer: {
        active: true,
        invitedOwnerEmail: "owner@example.com",
        hostStableId: stableId,
        createdAt: new Date(),
      },
    });
    expect(doc.waitingTransfer?.invitedOwnerEmail).toBe("owner@example.com");
  });
});
