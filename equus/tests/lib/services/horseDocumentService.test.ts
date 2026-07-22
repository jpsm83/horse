import { describe, it, expect, vi, beforeEach } from "vitest";
import mongoose from "mongoose";
import {
  deleteHorseDocument,
  createHorseDocument,
  getHorseDocumentDownloadMeta,
} from "@/lib/services/horseDocumentService";
import Document from "@/models/Document";
import Horse from "@/models/Horse";
import connectDb from "@/lib/db";

const { mockDestroy, mockUrl, mockPrivateDownloadUrl } = vi.hoisted(() => ({
  mockDestroy: vi.fn(),
  mockUrl: vi.fn(),
  mockPrivateDownloadUrl: vi.fn(),
}));

vi.mock("@/lib/services/horseAuditService", () => ({
  recordAudit: vi.fn().mockResolvedValue(undefined),
}));
vi.mock("@/lib/cloudinary/cloudinaryConfig", () => ({ default: vi.fn() }));
vi.mock("cloudinary", () => ({
  v2: {
    uploader: { destroy: mockDestroy },
    url: mockUrl,
    utils: {
      private_download_url: mockPrivateDownloadUrl,
    },
    config: vi.fn(),
  },
}));

describe("deleteHorseDocument", () => {
  let userId: string;
  let horseId: string;
  let docId: string;

  beforeEach(async () => {
    await connectDb();
    vi.clearAllMocks();
    mockDestroy.mockReset();
    mockDestroy.mockResolvedValue({ result: "ok" });
    mockUrl.mockReset();
    mockUrl.mockReturnValue("https://res.cloudinary.com/test/image/upload/fl_attachment/passport.pdf/doc123");
    mockPrivateDownloadUrl.mockReset();
    mockPrivateDownloadUrl.mockReturnValue(
      "https://api.cloudinary.com/v1_1/test/image/download?public_id=doc123&format=pdf",
    );

    const userObjId = new mongoose.Types.ObjectId();
    userId = userObjId.toHexString();

    const horse = await Horse.create({
      _id: new mongoose.Types.ObjectId(),
      mainOwnerUserId: userObjId,
      createdByUserId: userObjId,
      name: "Doc Horse",
      breed: "American Quarter Horse",
      sex: "Mare",
    });
    horseId = horse._id.toHexString();

    const doc = await Document.create({
      horseId: horse._id,
      uploadedByUserId: userObjId,
      documentType: "passport",
      title: "Test Passport",
      fileUrl: "https://res.cloudinary.com/test/image/upload/v1/test.pdf",
      fileName: "passport.pdf",
      mimeType: "application/pdf",
      storagePublicId: "equus/horses/test/documents/doc123",
    });
    docId = doc._id.toHexString();
  });

  it("hard-deletes document and Cloudinary asset when user is main owner", async () => {
    await deleteHorseDocument(userId, horseId, docId);

    const deleted = await Document.findById(docId).lean();
    expect(deleted).toBeNull();
    expect(mockDestroy).toHaveBeenCalledWith(
      "equus/horses/test/documents/doc123",
      expect.objectContaining({ resource_type: "image" }),
    );
  });

  it("throws 404 when user is not the horse owner", async () => {
    const strangerId = new mongoose.Types.ObjectId().toHexString();

    await expect(deleteHorseDocument(strangerId, horseId, docId)).rejects.toThrow(
      "Horse not found",
    );
  });

  it("throws 404 when document does not exist", async () => {
    const fakeId = new mongoose.Types.ObjectId().toHexString();

    await expect(deleteHorseDocument(userId, horseId, fakeId)).rejects.toThrow(
      "Document not found",
    );
  });

  it("throws 404 when document belongs to a different horse", async () => {
    const otherHorse = await Horse.create({
      _id: new mongoose.Types.ObjectId(),
      mainOwnerUserId: new mongoose.Types.ObjectId(userId),
      createdByUserId: userId,
      name: "Other Horse",
      breed: "Arabian",
      sex: "Stallion",
    });

    await expect(
      deleteHorseDocument(userId, otherHorse._id.toHexString(), docId),
    ).rejects.toThrow("Document not found");
  });

  it("throws when Cloudinary destroy fails (does not delete MongoDB)", async () => {
    mockDestroy.mockRejectedValue(new Error("network error"));

    await expect(deleteHorseDocument(userId, horseId, docId)).rejects.toThrow("network error");

    const stillExists = await Document.findById(docId).lean();
    expect(stillExists).not.toBeNull();
  });

  it("throws 400 for invalid document id", async () => {
    await expect(deleteHorseDocument(userId, horseId, "not-an-objectid")).rejects.toThrow(
      "Invalid document id",
    );
  });

  it("allows co-owner to delete document", async () => {
    const coOwnerId = new mongoose.Types.ObjectId().toHexString();
    await Horse.findByIdAndUpdate(horseId, {
      $push: { coOwners: { userId: new mongoose.Types.ObjectId(coOwnerId) } },
    });

    await deleteHorseDocument(coOwnerId, horseId, docId);

    const deleted = await Document.findById(docId).lean();
    expect(deleted).toBeNull();
  });

  it("allows responsible to delete document", async () => {
    const responsibleId = new mongoose.Types.ObjectId().toHexString();
    await Horse.findByIdAndUpdate(horseId, {
      $push: { responsibles: { userId: new mongoose.Types.ObjectId(responsibleId) } },
    });

    await deleteHorseDocument(responsibleId, horseId, docId);

    const deleted = await Document.findById(docId).lean();
    expect(deleted).toBeNull();
  });
});

describe("createHorseDocument", () => {
  it("creates a document for the horse", async () => {
    await connectDb();
    const userObjId = new mongoose.Types.ObjectId();
    const horse = await Horse.create({
      mainOwnerUserId: userObjId,
      createdByUserId: userObjId,
      name: "Create Doc Horse",
      breed: "Lusitano",
      sex: "Gelding",
    });

    const created = await createHorseDocument(userObjId.toHexString(), horse._id.toHexString(), {
      documentType: "insurance",
      title: "Policy",
      fileUrl: "https://example.com/f.pdf",
      fileName: "f.pdf",
      mimeType: "application/pdf",
    });

    expect(created.title).toBe("Policy");
    expect(created.documentType).toBe("insurance");
  });
});

describe("getHorseDocumentDownloadMeta", () => {
  let userId: string;
  let horseId: string;
  let docId: string;

  beforeEach(async () => {
    await connectDb();
    vi.clearAllMocks();
    mockUrl.mockReturnValue("https://res.cloudinary.com/test/image/upload/fl_attachment/passport.pdf/doc123");
    mockPrivateDownloadUrl.mockReturnValue(
      "https://api.cloudinary.com/v1_1/test/image/download?public_id=doc123&format=pdf",
    );

    const userObjId = new mongoose.Types.ObjectId();
    userId = userObjId.toHexString();

    const horse = await Horse.create({
      _id: new mongoose.Types.ObjectId(),
      mainOwnerUserId: userObjId,
      createdByUserId: userObjId,
      name: "Download Horse",
      breed: "American Quarter Horse",
      sex: "Mare",
    });
    horseId = horse._id.toHexString();

    const doc = await Document.create({
      horseId: horse._id,
      uploadedByUserId: userObjId,
      documentType: "passport",
      title: "Download Passport",
      fileUrl: "https://res.cloudinary.com/test/image/upload/v1/test.pdf",
      fileName: "passport.pdf",
      mimeType: "application/pdf",
      storagePublicId: "equus/horses/test/documents/doc123",
    });
    docId = doc._id.toHexString();
  });

  it("returns download metadata for horse owner", async () => {
    const meta = await getHorseDocumentDownloadMeta(userId, horseId, docId);

    expect(meta.fileName).toBe("passport.pdf");
    expect(meta.mimeType).toBe("application/pdf");
    expect(meta.downloadUrls).toHaveLength(3);
  });

  it("throws 404 when user is not the horse owner", async () => {
    const strangerId = new mongoose.Types.ObjectId().toHexString();

    await expect(getHorseDocumentDownloadMeta(strangerId, horseId, docId)).rejects.toThrow(
      "Horse not found",
    );
  });

  it("throws 404 when document belongs to a different horse", async () => {
    const otherHorse = await Horse.create({
      _id: new mongoose.Types.ObjectId(),
      mainOwnerUserId: new mongoose.Types.ObjectId(userId),
      createdByUserId: userId,
      name: "Other Horse",
      breed: "Arabian",
      sex: "Stallion",
    });

    await expect(
      getHorseDocumentDownloadMeta(userId, otherHorse._id.toHexString(), docId),
    ).rejects.toThrow("Document not found");
  });
});
