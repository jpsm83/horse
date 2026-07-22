import { describe, it, expect, vi, beforeEach } from "vitest";
import mongoose from "mongoose";
import connectDb from "@/lib/db";
import Horse from "@/models/Horse";
import Media from "@/models/Media";
import MediaDeletionRequest from "@/models/MediaDeletionRequest";
import * as mediaDeletionService from "@/lib/services/mediaDeletionService";

vi.mock("@/lib/services/notificationService", () => ({
  createNotification: vi.fn().mockResolvedValue(undefined),
}));

vi.mock("@/lib/services/horseAuditService", () => ({
  recordAudit: vi.fn().mockResolvedValue(undefined),
}));

vi.mock("@/lib/cloudinary/cloudinaryConfig", () => ({ default: vi.fn() }));
vi.mock("cloudinary", () => ({
  v2: {
    uploader: { destroy: vi.fn().mockResolvedValue({ result: "ok" }) },
    api: { delete_folder: vi.fn() },
    config: vi.fn(),
  },
}));

describe("mediaDeletionService", () => {
  let ownerId: string;
  let coOwnerId: string;
  let nonOwnerId: string;
  let horseId: string;
  let mediaId: string;
  let horseObjectId: mongoose.Types.ObjectId;

  beforeEach(async () => {
    await connectDb();
    vi.clearAllMocks();

    ownerId = new mongoose.Types.ObjectId().toHexString();
    coOwnerId = new mongoose.Types.ObjectId().toHexString();
    nonOwnerId = new mongoose.Types.ObjectId().toHexString();
    horseObjectId = new mongoose.Types.ObjectId();

    await Horse.create({
      _id: horseObjectId,
      mainOwnerUserId: new mongoose.Types.ObjectId(ownerId),
      createdByUserId: new mongoose.Types.ObjectId(ownerId),
      coOwners: [{ userId: new mongoose.Types.ObjectId(coOwnerId), ownershipPercentage: 50 }],
      name: "Test Horse",
      breed: "American Quarter Horse",
      sex: "Mare",
    });
    horseId = horseObjectId.toHexString();

    const media = await Media.create({
      horseId: horseObjectId,
      uploadedByUserId: new mongoose.Types.ObjectId(nonOwnerId),
      type: "image",
      url: "https://example.com/img.jpg",
      storagePublicId: "equus/test/media/img",
      title: "Test Image",
    });
    mediaId = media._id.toHexString();
  });

  describe("createDeletionRequest", () => {
    it("creates a pending request for a non-owner", async () => {
      const result = await mediaDeletionService.createDeletionRequest(
        nonOwnerId,
        horseId,
        mediaId,
        "Please delete this image",
      );

      expect(result.status).toBe("pending");
      expect(result.requesterUserId).toBe(nonOwnerId);
      expect(result.requestMessage).toBe("Please delete this image");
    });

    it("rejects when requester is the owner", async () => {
      await expect(
        mediaDeletionService.createDeletionRequest(ownerId, horseId, mediaId),
      ).rejects.toThrow("Owners cannot request deletion");
    });

    it("rejects when requester is a co-owner", async () => {
      await expect(
        mediaDeletionService.createDeletionRequest(coOwnerId, horseId, mediaId),
      ).rejects.toThrow("Owners cannot request deletion");
    });

    it("rejects if a pending request already exists for the same media", async () => {
      await mediaDeletionService.createDeletionRequest(nonOwnerId, horseId, mediaId);

      await expect(
        mediaDeletionService.createDeletionRequest(nonOwnerId, horseId, mediaId),
      ).rejects.toThrow("A pending deletion request already exists");
    });

    it("throws 404 when media does not exist", async () => {
      const fakeId = new mongoose.Types.ObjectId().toHexString();
      await expect(
        mediaDeletionService.createDeletionRequest(nonOwnerId, horseId, fakeId),
      ).rejects.toThrow("Media not found");
    });
  });

  describe("approveDeletionRequest", () => {
    let requestId: string;

    beforeEach(async () => {
      const req = await mediaDeletionService.createDeletionRequest(
        nonOwnerId,
        horseId,
        mediaId,
      );
      requestId = req.id;
    });

    it("owner approves and media is hard-deleted", async () => {
      const result = await mediaDeletionService.approveDeletionRequest(
        ownerId,
        requestId,
      );

      expect(result.status).toBe("approved");
      expect(result.decisionByUserId).toBe(ownerId);

      const deleted = await Media.findById(mediaId).lean();
      expect(deleted).toBeNull();
    });

    it("co-owner can approve", async () => {
      const result = await mediaDeletionService.approveDeletionRequest(
        coOwnerId,
        requestId,
      );

      expect(result.status).toBe("approved");
    });

    it("rejects approval from non-owner", async () => {
      await expect(
        mediaDeletionService.approveDeletionRequest(nonOwnerId, requestId),
      ).rejects.toThrow("Only a responsible person (or owner if none) can decide");
    });

    it("rejects approval if request is already resolved", async () => {
      await mediaDeletionService.approveDeletionRequest(ownerId, requestId);

      await expect(
        mediaDeletionService.approveDeletionRequest(ownerId, requestId),
      ).rejects.toThrow("Request is no longer pending");
    });
  });

  describe("declineDeletionRequest", () => {
    let requestId: string;

    beforeEach(async () => {
      const req = await mediaDeletionService.createDeletionRequest(
        nonOwnerId,
        horseId,
        mediaId,
      );
      requestId = req.id;
    });

    it("owner declines and media is NOT deleted", async () => {
      const result = await mediaDeletionService.declineDeletionRequest(
        ownerId,
        requestId,
        "Keep it",
      );

      expect(result.status).toBe("declined");
      expect(result.responseMessage).toBe("Keep it");

      const stillExists = await Media.findById(mediaId).lean();
      expect(stillExists).not.toBeNull();
    });

    it("rejects decline from non-owner", async () => {
      await expect(
        mediaDeletionService.declineDeletionRequest(nonOwnerId, requestId),
      ).rejects.toThrow("Only a responsible person (or owner if none) can decide");
    });

    it("rejects decline if request is already cancelled", async () => {
      await mediaDeletionService.cancelDeletionRequest(nonOwnerId, requestId);

      await expect(
        mediaDeletionService.declineDeletionRequest(ownerId, requestId),
      ).rejects.toThrow("Request is no longer pending");
    });
  });

  describe("cancelDeletionRequest", () => {
    let requestId: string;

    beforeEach(async () => {
      const req = await mediaDeletionService.createDeletionRequest(
        nonOwnerId,
        horseId,
        mediaId,
      );
      requestId = req.id;
    });

    it("requester can cancel their own pending request", async () => {
      const result = await mediaDeletionService.cancelDeletionRequest(
        nonOwnerId,
        requestId,
      );

      expect(result.status).toBe("cancelled");
    });

    it("rejects cancel from a different user", async () => {
      const otherId = new mongoose.Types.ObjectId().toHexString();

      await expect(
        mediaDeletionService.cancelDeletionRequest(otherId, requestId),
      ).rejects.toThrow("Only the requester can cancel");
    });

    it("rejects cancel if request is already approved", async () => {
      await mediaDeletionService.approveDeletionRequest(ownerId, requestId);

      await expect(
        mediaDeletionService.cancelDeletionRequest(nonOwnerId, requestId),
      ).rejects.toThrow("Request is no longer pending");
    });
  });

  describe("listDeletionRequests", () => {
    beforeEach(async () => {
      await mediaDeletionService.createDeletionRequest(nonOwnerId, horseId, mediaId);
    });

    it("owner can list pending requests", async () => {
      const requests = await mediaDeletionService.listDeletionRequests(
        ownerId,
        horseId,
      );

      expect(requests).toHaveLength(1);
      expect(requests[0].status).toBe("pending");
    });

    it("co-owner can list pending requests", async () => {
      const requests = await mediaDeletionService.listDeletionRequests(
        coOwnerId,
        horseId,
      );

      expect(requests).toHaveLength(1);
    });

    it("rejects listing from non-owner", async () => {
      await expect(
        mediaDeletionService.listDeletionRequests(nonOwnerId, horseId),
      ).rejects.toThrow("Only a responsible person (or owner if none) can decide");
    });

    it("filters by status", async () => {
      const requests = await mediaDeletionService.listDeletionRequests(
        ownerId,
        horseId,
        "pending",
      );

      expect(requests).toHaveLength(1);
    });

    it("returns empty array when status filter matches nothing", async () => {
      const requests = await mediaDeletionService.listDeletionRequests(
        ownerId,
        horseId,
        "approved",
      );

      expect(requests).toHaveLength(0);
    });

    it("when responsibles exist, only they can list — owner cannot", async () => {
      const responsibleId = new mongoose.Types.ObjectId().toHexString();
      await Horse.findByIdAndUpdate(horseId, {
        $push: { responsibles: { userId: new mongoose.Types.ObjectId(responsibleId) } },
      });

      await expect(
        mediaDeletionService.listDeletionRequests(ownerId, horseId),
      ).rejects.toThrow("Only a responsible person (or owner if none) can decide");

      const requests = await mediaDeletionService.listDeletionRequests(
        responsibleId,
        horseId,
      );
      expect(requests).toHaveLength(1);
    });
  });
});
