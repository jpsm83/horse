import { describe, it, expect, vi, beforeEach } from "vitest";
import mongoose from "mongoose";
import { deleteMedia, createMedia, listMedia } from "@/lib/services/mediaService";
import Media from "@/models/Media";
import Horse from "@/models/Horse";
import connectDb from "@/lib/db";

const { mockDestroy } = vi.hoisted(() => ({
  mockDestroy: vi.fn(),
}));

vi.mock("@/lib/services/horseAuditService", () => ({
  recordAudit: vi.fn().mockResolvedValue(undefined),
}));
vi.mock("@/lib/cloudinary/cloudinaryConfig", () => ({ default: vi.fn() }));
vi.mock("cloudinary", () => ({
  v2: {
    uploader: { destroy: mockDestroy },
    api: { delete_folder: vi.fn() },
    config: vi.fn(),
  },
}));

describe("deleteMedia", () => {
  let userId: string;
  let horseId: string;
  let mediaId: string;

  beforeEach(async () => {
    await connectDb();
    vi.clearAllMocks();
    mockDestroy.mockReset();
    mockDestroy.mockResolvedValue({ result: "ok" });

    const userObjId = new mongoose.Types.ObjectId();
    userId = userObjId.toHexString();

    const horse = await Horse.create({
      _id: new mongoose.Types.ObjectId(),
      mainOwnerUserId: userObjId,
      createdByUserId: userObjId,
      name: "Test Horse",
      breed: "American Quarter Horse",
      sex: "Mare",
    });
    horseId = horse._id.toHexString();

    const media = await Media.create({
      horseId: horse._id,
      uploadedByUserId: userObjId,
      type: "image",
      url: "https://res.cloudinary.com/test/image/upload/v1/test.jpg",
      storagePublicId: "equus/horses/test/media/image/test123",
      title: "Test Image",
    });
    mediaId = media._id.toHexString();
  });

  it("hard-deletes media and Cloudinary asset when user is main owner", async () => {
    await deleteMedia(userId, horseId, mediaId);

    const deleted = await Media.findById(mediaId).lean();
    expect(deleted).toBeNull();
    expect(mockDestroy).toHaveBeenCalledWith(
      "equus/horses/test/media/image/test123",
      expect.objectContaining({ resource_type: "image" }),
    );
  });

  it("throws 404 when user is not the horse owner", async () => {
    const strangerId = new mongoose.Types.ObjectId().toHexString();

    await expect(
      deleteMedia(strangerId, horseId, mediaId),
    ).rejects.toThrow("Horse not found");
  });

  it("throws 404 when media does not exist", async () => {
    const fakeId = new mongoose.Types.ObjectId().toHexString();

    await expect(
      deleteMedia(userId, horseId, fakeId),
    ).rejects.toThrow("Media not found");
  });

  it("throws 404 when media belongs to a different horse", async () => {
    const otherHorse = await Horse.create({
      _id: new mongoose.Types.ObjectId(),
      mainOwnerUserId: new mongoose.Types.ObjectId(userId),
      createdByUserId: userId,
      name: "Other Horse",
      breed: "Arabian",
      sex: "Stallion",
    });
    const otherHorseId = otherHorse._id.toHexString();

    await expect(
      deleteMedia(userId, otherHorseId, mediaId),
    ).rejects.toThrow("Media not found");
  });

  it("throws when Cloudinary destroy fails (does not delete MongoDB)", async () => {
    mockDestroy.mockRejectedValue(new Error("network error"));

    await expect(deleteMedia(userId, horseId, mediaId)).rejects.toThrow("network error");

    const stillExists = await Media.findById(mediaId).lean();
    expect(stillExists).not.toBeNull();
  });

  it("throws 400 for invalid media id", async () => {
    await expect(
      deleteMedia(userId, horseId, "not-an-objectid"),
    ).rejects.toThrow("Invalid media id");
  });

  it("allows co-owner to delete media", async () => {
    const coOwnerId = new mongoose.Types.ObjectId().toHexString();
    await Horse.findByIdAndUpdate(horseId, {
      $push: { coOwners: { userId: new mongoose.Types.ObjectId(coOwnerId) } },
    });

    await deleteMedia(coOwnerId, horseId, mediaId);

    const deleted = await Media.findById(mediaId).lean();
    expect(deleted).toBeNull();
  });
});

describe("createMedia", () => {
  it("creates a media record with the given input", async () => {
    await connectDb();
    const userId = new mongoose.Types.ObjectId().toHexString();
    const horseId = new mongoose.Types.ObjectId().toHexString();

    const result = await createMedia(userId, horseId, {
      type: "image",
      url: "https://example.com/img.jpg",
      title: "New Image",
    });

    expect(result.type).toBe("image");
    expect(result.title).toBe("New Image");
    expect(result.horseId).toBe(horseId);
  });
});

describe("listMedia", () => {
  it("returns only active media for a horse", async () => {
    await connectDb();
    const horseId = new mongoose.Types.ObjectId().toHexString();
    const userId = new mongoose.Types.ObjectId().toHexString();

    await Media.create([
      {
        horseId: new mongoose.Types.ObjectId(horseId),
        uploadedByUserId: new mongoose.Types.ObjectId(userId),
        type: "image",
        url: "https://example.com/img1.jpg",
        isActive: true,
      },
      {
        horseId: new mongoose.Types.ObjectId(horseId),
        uploadedByUserId: new mongoose.Types.ObjectId(userId),
        type: "image",
        url: "https://example.com/img2.jpg",
        isActive: false,
      },
    ]);

    const items = await listMedia(horseId);
    expect(items).toHaveLength(1);
  });
});
