import { describe, it, expect, vi, beforeEach } from "vitest";
import mongoose from "mongoose";
import { deleteMedia, createMedia, listMedia, listHorseHubGallery } from "@/lib/services/mediaService";
import Media from "@/models/Media";
import Horse from "@/models/Horse";
import User from "@/models/User";
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
  it("returns only active media for owner team", async () => {
    await connectDb();
    const email = `media-list-owner-${Date.now()}@example.com`;
    const owner = await User.create({
      personalDetails: { email, password: "hash" },
      authProvider: "credentials",
    });
    const ownerId = owner._id.toHexString();
    const horse = await Horse.create({
      mainOwnerUserId: owner._id,
      createdByUserId: owner._id,
      name: "List Horse",
      breed: "Arabian",
      sex: "Mare",
      profileVisibility: "public",
    });
    const horseId = horse._id.toHexString();

    await Media.create([
      {
        horseId: horse._id,
        uploadedByUserId: owner._id,
        type: "image",
        url: "https://example.com/img1.jpg",
        isActive: true,
        visibilityMode: "public",
      },
      {
        horseId: horse._id,
        uploadedByUserId: owner._id,
        type: "image",
        url: "https://example.com/img2.jpg",
        isActive: false,
        visibilityMode: "public",
      },
      {
        horseId: horse._id,
        uploadedByUserId: owner._id,
        type: "image",
        url: "https://example.com/img3.jpg",
        isActive: true,
        visibilityMode: "owner",
      },
    ]);

    const items = await listMedia(horseId, { id: ownerId });
    expect(items).toHaveLength(2);
  });

  it("returns 404 when Layer 1 denies the viewer", async () => {
    await connectDb();
    const email = `media-l1-owner-${Date.now()}@example.com`;
    const owner = await User.create({
      personalDetails: { email, password: "hash" },
      authProvider: "credentials",
    });
    const horse = await Horse.create({
      mainOwnerUserId: owner._id,
      createdByUserId: owner._id,
      name: "Private Horse",
      breed: "Arabian",
      sex: "Mare",
      profileVisibility: "owner",
    });

    await expect(listMedia(horse._id.toHexString())).rejects.toMatchObject({
      statusCode: 404,
    });
  });

  it("returns empty list when Layer 2 gallery denies non-owners", async () => {
    await connectDb();
    const email = `media-l2-owner-${Date.now()}@example.com`;
    const owner = await User.create({
      personalDetails: { email, password: "hash" },
      authProvider: "credentials",
    });
    const horse = await Horse.create({
      mainOwnerUserId: owner._id,
      createdByUserId: owner._id,
      name: "Gallery Hidden",
      breed: "Arabian",
      sex: "Mare",
      profileVisibility: "public",
      hubSections: { gallery: { mode: "owner" } },
    });

    await Media.create({
      horseId: horse._id,
      uploadedByUserId: owner._id,
      type: "image",
      url: "https://example.com/hidden.jpg",
      isActive: true,
      visibilityMode: "public",
    });

    const items = await listMedia(horse._id.toHexString());
    expect(items).toHaveLength(0);
  });

  it("filters item visibility for guests when gallery is public", async () => {
    await connectDb();
    const email = `media-item-owner-${Date.now()}@example.com`;
    const owner = await User.create({
      personalDetails: { email, password: "hash" },
      authProvider: "credentials",
    });
    const horse = await Horse.create({
      mainOwnerUserId: owner._id,
      createdByUserId: owner._id,
      name: "Public Gallery",
      breed: "Arabian",
      sex: "Mare",
      profileVisibility: "public",
      hubSections: { gallery: { mode: "public" } },
    });

    await Media.create([
      {
        horseId: horse._id,
        uploadedByUserId: owner._id,
        type: "image",
        url: "https://example.com/public.jpg",
        isActive: true,
        visibilityMode: "public",
      },
      {
        horseId: horse._id,
        uploadedByUserId: owner._id,
        type: "image",
        url: "https://example.com/owner-only.jpg",
        isActive: true,
        visibilityMode: "owner",
      },
    ]);

    const items = await listMedia(horse._id.toHexString());
    expect(items).toHaveLength(1);
    expect(items[0]?.url).toContain("public.jpg");
  });
});

describe("listHorseHubGallery", () => {
  it("paginates hub-visible public media for guests", async () => {
    await connectDb();
    const owner = await User.create({
      personalDetails: {
        email: `hub-gal-owner-${Date.now()}@example.com`,
        password: "hash",
      },
      authProvider: "credentials",
    });
    const horse = await Horse.create({
      mainOwnerUserId: owner._id,
      createdByUserId: owner._id,
      name: "Hub Gallery Horse",
      breed: "Arabian",
      sex: "Mare",
      profileVisibility: "public",
      hubSections: { gallery: { mode: "public" } },
    });
    const horseId = horse._id.toHexString();

    await Media.create(
      Array.from({ length: 5 }, (_, i) => ({
        horseId: horse._id,
        uploadedByUserId: owner._id,
        type: i % 2 === 0 ? "image" : "video",
        url: `https://example.com/m${i}.jpg`,
        isActive: true,
        isVisibleOnHub: true,
        visibilityMode: "public",
        createdAt: new Date(Date.now() - i * 1000),
      })),
    );

    const page1 = await listHorseHubGallery(horseId, null, {
      page: 1,
      pageSize: 2,
      type: "all",
    });
    expect(page1.total).toBe(5);
    expect(page1.items).toHaveLength(2);
    expect(page1.page).toBe(1);
    expect(page1.pageSize).toBe(2);

    const photos = await listHorseHubGallery(horseId, null, {
      page: 1,
      pageSize: 12,
      type: "photos",
    });
    expect(photos.total).toBe(3);
    expect(photos.items.every((m) => m.type === "image")).toBe(true);
  });

  it("excludes hub-hidden and owner-only media for guests", async () => {
    await connectDb();
    const owner = await User.create({
      personalDetails: {
        email: `hub-gal-hide-${Date.now()}@example.com`,
        password: "hash",
      },
      authProvider: "credentials",
    });
    const horse = await Horse.create({
      mainOwnerUserId: owner._id,
      createdByUserId: owner._id,
      name: "Hub Hide Horse",
      breed: "Arabian",
      sex: "Mare",
      profileVisibility: "public",
      hubSections: { gallery: { mode: "public" } },
    });
    const horseId = horse._id.toHexString();

    await Media.create([
      {
        horseId: horse._id,
        uploadedByUserId: owner._id,
        type: "image",
        url: "https://example.com/visible.jpg",
        isActive: true,
        isVisibleOnHub: true,
        visibilityMode: "public",
      },
      {
        horseId: horse._id,
        uploadedByUserId: owner._id,
        type: "image",
        url: "https://example.com/hub-off.jpg",
        isActive: true,
        isVisibleOnHub: false,
        visibilityMode: "public",
      },
      {
        horseId: horse._id,
        uploadedByUserId: owner._id,
        type: "image",
        url: "https://example.com/owner-mode.jpg",
        isActive: true,
        isVisibleOnHub: true,
        visibilityMode: "owner",
      },
    ]);

    const result = await listHorseHubGallery(horseId, null, {
      page: 1,
      pageSize: 12,
      type: "all",
    });
    expect(result.total).toBe(1);
    expect(result.items[0]?.url).toContain("visible.jpg");
  });

  it("returns empty when Layer 2 gallery is owner-only for guests", async () => {
    await connectDb();
    const owner = await User.create({
      personalDetails: {
        email: `hub-gal-l2-${Date.now()}@example.com`,
        password: "hash",
      },
      authProvider: "credentials",
    });
    const horse = await Horse.create({
      mainOwnerUserId: owner._id,
      createdByUserId: owner._id,
      name: "Private Gallery Section",
      breed: "Arabian",
      sex: "Mare",
      profileVisibility: "public",
      hubSections: { gallery: { mode: "owner" } },
    });
    await Media.create({
      horseId: horse._id,
      uploadedByUserId: owner._id,
      type: "image",
      url: "https://example.com/x.jpg",
      isActive: true,
      isVisibleOnHub: true,
      visibilityMode: "public",
    });

    const result = await listHorseHubGallery(horse._id.toHexString(), null, {
      page: 1,
      pageSize: 12,
    });
    expect(result.total).toBe(0);
    expect(result.items).toEqual([]);
  });
});
