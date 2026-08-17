import { describe, it, expect, vi, beforeEach } from "vitest";
import mongoose from "mongoose";
import connectDb from "@/lib/db";
import Horse from "@/models/Horse";
import Document from "@/models/Document";
import * as documentDeletionService from "@/lib/services/documentDeletionService";

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
    config: vi.fn(),
  },
}));

describe("documentDeletionService", () => {
  let ownerId: string;
  let nonOwnerId: string;
  let horseId: string;
  let documentId: string;

  beforeEach(async () => {
    await connectDb();
    vi.clearAllMocks();

    ownerId = new mongoose.Types.ObjectId().toHexString();
    nonOwnerId = new mongoose.Types.ObjectId().toHexString();
    const horseObjectId = new mongoose.Types.ObjectId();

    await Horse.create({
      _id: horseObjectId,
      mainOwnerUserId: new mongoose.Types.ObjectId(ownerId),
      createdByUserId: new mongoose.Types.ObjectId(ownerId),
      name: "Doc Delete Horse",
      breed: "American Quarter Horse",
      sex: "Mare",
    });
    horseId = horseObjectId.toHexString();

    const doc = await Document.create({
      horseId: horseObjectId,
      uploadedByUserId: new mongoose.Types.ObjectId(nonOwnerId),
      documentType: "passport",
      title: "Passport",
      fileUrl: "https://example.com/p.pdf",
      fileName: "p.pdf",
      mimeType: "application/pdf",
      storagePublicId: "equus/test/documents/p",
    });
    documentId = doc._id.toHexString();
  });

  it("creates a pending request for a non-owner", async () => {
    const result = await documentDeletionService.createDeletionRequest(
      nonOwnerId,
      horseId,
      documentId,
      "Please delete",
    );

    expect(result.status).toBe("pending");
    expect(result.documentId).toBe(documentId);
  });

  it("rejects when requester is the owner", async () => {
    await expect(
      documentDeletionService.createDeletionRequest(ownerId, horseId, documentId),
    ).rejects.toThrow("Owners cannot request deletion");
  });

  it("owner approves and document is hard-deleted", async () => {
    const req = await documentDeletionService.createDeletionRequest(
      nonOwnerId,
      horseId,
      documentId,
    );

    const result = await documentDeletionService.approveDeletionRequest(ownerId, req.id);

    expect(result.status).toBe("approved");
    const deleted = await Document.findById(documentId).lean();
    expect(deleted).toBeNull();
  });

  it("when responsibles exist, responsible can approve and owner cannot", async () => {
    const responsibleId = new mongoose.Types.ObjectId().toHexString();
    await Horse.findByIdAndUpdate(horseId, {
      $push: { responsibles: { userId: new mongoose.Types.ObjectId(responsibleId) } },
    });

    const req = await documentDeletionService.createDeletionRequest(
      nonOwnerId,
      horseId,
      documentId,
    );

    await expect(
      documentDeletionService.approveDeletionRequest(ownerId, req.id),
    ).rejects.toThrow("Only a responsible person (or owner if none) can decide");

    const result = await documentDeletionService.approveDeletionRequest(
      responsibleId,
      req.id,
    );
    expect(result.status).toBe("approved");
  });
});
