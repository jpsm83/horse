import { describe, it, expect, vi, beforeEach } from "vitest";
import { createMedia, listMedia, deleteMedia, extractStoragePublicId } from "@/lib/services/horseMediaService";
import HorseMedia from "@/models/HorseMedia";

const { mockDestroy } = vi.hoisted(() => ({
  mockDestroy: vi.fn(),
}));

vi.mock("@/models/HorseMedia");
vi.mock("@/lib/services/horseAuditService");
vi.mock("@/lib/cloudinary/cloudinaryConfig");
vi.mock("cloudinary", () => ({
  v2: {
    uploader: {
      destroy: mockDestroy,
    },
    api: { delete_folder: vi.fn() },
    config: vi.fn(),
  },
}));

describe("extractStoragePublicId", () => {
  it("extracts public_id from a Cloudinary secure_url", () => {
    const url = "https://res.cloudinary.com/demo/image/upload/v1234567890/equus/horses/abc/media/horse/550e8400.jpg";
    const result = extractStoragePublicId(url);
    expect(result).toBe("equus/horses/abc/media/horse/550e8400");
  });

  it("returns null for non-Cloudinary URLs", () => {
    expect(extractStoragePublicId("https://example.com/image.jpg")).toBeNull();
  });
});

describe("deleteMedia", () => {
  const mockFindByIdAndUpdate = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    mockFindByIdAndUpdate.mockReset();
    (HorseMedia as any).findByIdAndUpdate = mockFindByIdAndUpdate;
  });

  it("destroys Cloudinary resource and soft-deletes the record", async () => {
    mockFindByIdAndUpdate.mockResolvedValue({ _id: "media123" });
    mockDestroy.mockResolvedValue({ result: "ok" });

    await deleteMedia("media123", "equus/horses/abc/media/horse/550e8400");

    expect(mockDestroy).toHaveBeenCalledWith("equus/horses/abc/media/horse/550e8400", expect.any(Object));
    expect(mockFindByIdAndUpdate).toHaveBeenCalledWith("media123", { isActive: false });
  });

  it("soft-deletes even if Cloudinary destroy fails", async () => {
    mockFindByIdAndUpdate.mockResolvedValue({ _id: "media123" });
    mockDestroy.mockRejectedValue(new Error("network error"));

    await deleteMedia("media123", "equus/horses/abc/media/horse/550e8400");

    expect(mockFindByIdAndUpdate).toHaveBeenCalledWith("media123", { isActive: false });
  });

  it("soft-deletes when no storagePublicId provided", async () => {
    mockFindByIdAndUpdate.mockResolvedValue({ _id: "media123" });

    await deleteMedia("media123", undefined);

    expect(mockDestroy).not.toHaveBeenCalled();
    expect(mockFindByIdAndUpdate).toHaveBeenCalledWith("media123", { isActive: false });
  });
});
