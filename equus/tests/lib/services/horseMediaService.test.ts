import { describe, it, expect, vi, beforeEach } from "vitest";
import { deleteMedia } from "@/lib/services/horseMediaService";
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

describe("deleteMedia", () => {
  const mockFindByIdAndUpdate = vi.fn();
  const STORAGE_PUBLIC_ID = "equus/horses/abc/media/horse/550e8400";

  beforeEach(() => {
    vi.clearAllMocks();
    mockFindByIdAndUpdate.mockReset();
    (HorseMedia as any).findByIdAndUpdate = mockFindByIdAndUpdate;
  });

  it("destroys Cloudinary resource and soft-deletes the record", async () => {
    mockFindByIdAndUpdate.mockResolvedValue({ _id: "media123" });
    mockDestroy.mockResolvedValue({ result: "ok" });

    await deleteMedia("media123", STORAGE_PUBLIC_ID);

    expect(mockDestroy).toHaveBeenCalledWith(STORAGE_PUBLIC_ID, expect.objectContaining({ resource_type: "auto" }));
    expect(mockFindByIdAndUpdate).toHaveBeenCalledWith("media123", { isActive: false });
  });

  it("soft-deletes even if Cloudinary destroy fails", async () => {
    mockFindByIdAndUpdate.mockResolvedValue({ _id: "media123" });
    mockDestroy.mockRejectedValue(new Error("network error"));

    await deleteMedia("media123", STORAGE_PUBLIC_ID);

    expect(mockFindByIdAndUpdate).toHaveBeenCalledWith("media123", { isActive: false });
  });

  it("soft-deletes when no storagePublicId provided", async () => {
    mockFindByIdAndUpdate.mockResolvedValue({ _id: "media123" });

    await deleteMedia("media123", undefined);

    expect(mockDestroy).not.toHaveBeenCalled();
    expect(mockFindByIdAndUpdate).toHaveBeenCalledWith("media123", { isActive: false });
  });

  it("soft-deletes when storagePublicId is null", async () => {
    mockFindByIdAndUpdate.mockResolvedValue({ _id: "media123" });

    await deleteMedia("media123", null);

    expect(mockDestroy).not.toHaveBeenCalled();
    expect(mockFindByIdAndUpdate).toHaveBeenCalledWith("media123", { isActive: false });
  });
});
