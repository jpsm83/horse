### Task 1: Add `deleteMedia` to horseMediaService

**Files:**
- Modify: `lib/services/horseMediaService.ts`
- Create: `tests/lib/services/horseMediaService.test.ts`

**Interfaces:**
- Consumes: `HorseMedia` model, `recordAudit` from `@/lib/services/horseAuditService.ts`, `configureCloudinary` from `@/lib/cloudinary/cloudinaryConfig.ts`, `v2 as cloudinary` from `"cloudinary"`, `CLOUDINARY_UPLOAD_PRESET` from `@/lib/cloudinary/constants.ts`
- Produces:
  - `deleteMedia(mediaId: string): Promise<void>` — deletes Cloudinary file + soft-deletes record
  - `extractStoragePublicId(url: string): string | null` — extracts Cloudinary public_id from secure_url

- [ ] **Step 1: Write failing test**

```typescript
// tests/lib/services/horseMediaService.test.ts
import { describe, it, expect, vi, beforeEach } from "vitest";
import { createMedia, listMedia, deleteMedia, extractStoragePublicId } from "@/lib/services/horseMediaService";
import HorseMedia from "@/models/HorseMedia";

vi.mock("@/models/HorseMedia");
vi.mock("@/lib/services/horseAuditService");
vi.mock("@/lib/cloudinary/cloudinaryConfig");
vi.mock("cloudinary");

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
  const mockUploaderDestroy = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    (HorseMedia as any).findByIdAndUpdate = mockFindByIdAndUpdate;
    const { v2 } = require("cloudinary");
    v2.uploader.destroy = mockUploaderDestroy;
  });

  it("destroys Cloudinary resource and soft-deletes the record", async () => {
    mockFindByIdAndUpdate.mockResolvedValue({ _id: "media123" });
    mockUploaderDestroy.mockResolvedValue({ result: "ok" });

    await deleteMedia("media123", "equus/horses/abc/media/horse/550e8400");

    expect(mockUploaderDestroy).toHaveBeenCalledWith("equus/horses/abc/media/horse/550e8400", expect.any(Object));
    expect(mockFindByIdAndUpdate).toHaveBeenCalledWith("media123", { isActive: false });
  });

  it("soft-deletes even if Cloudinary destroy fails", async () => {
    mockFindByIdAndUpdate.mockResolvedValue({ _id: "media123" });
    mockUploaderDestroy.mockRejectedValue(new Error("network error"));

    await deleteMedia("media123", "equus/horses/abc/media/horse/550e8400");

    expect(mockFindByIdAndUpdate).toHaveBeenCalledWith("media123", { isActive: false });
  });

  it("soft-deletes when no storagePublicId provided", async () => {
    mockFindByIdAndUpdate.mockResolvedValue({ _id: "media123" });

    await deleteMedia("media123", undefined);

    expect(mockUploaderDestroy).not.toHaveBeenCalled();
    expect(mockFindByIdAndUpdate).toHaveBeenCalledWith("media123", { isActive: false });
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run tests/lib/services/horseMediaService.test.ts`
Expected: FAIL — `deleteMedia is not a function` / `extractStoragePublicId is not exported`

- [ ] **Step 3: Add `extractStoragePublicId` and `deleteMedia` to the service**

```typescript
// Add to lib/services/horseMediaService.ts — keep existing imports and functions, add imports + new functions below them

import configureCloudinary from "@/lib/cloudinary/cloudinaryConfig.ts";
import { v2 as cloudinary } from "cloudinary";
import { CLOUDINARY_UPLOAD_PRESET } from "@/lib/cloudinary/constants.ts";

export function extractStoragePublicId(url: string): string | null {
  const pattern = new RegExp(`${CLOUDINARY_UPLOAD_PRESET}\\/[^.]+`);
  const match = url.match(pattern);
  return match ? match[0] : null;
}

export async function deleteMedia(
  mediaId: string,
  storagePublicId?: string | null,
): Promise<void> {
  if (storagePublicId) {
    configureCloudinary();
    await cloudinary.uploader
      .destroy(storagePublicId, { resource_type: "auto" })
      .catch(() => {});
  }
  await HorseMedia.findByIdAndUpdate(mediaId, { isActive: false });
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `npx vitest run tests/lib/services/horseMediaService.test.ts`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add lib/services/horseMediaService.ts tests/lib/services/horseMediaService.test.ts
git commit -m "feat: add deleteMedia and extractStoragePublicId to horseMediaService"
```


