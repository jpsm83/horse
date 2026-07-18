# Media Tab Rebuild Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Rebuild the horse Media tab with drag-and-drop upload, thumbnail gallery, lightbox viewer, and per-entity Cloudinary folder organization.

**Architecture:** Dedicated upload route (`POST .../media/upload`) combines Cloudinary upload + HorseMedia record creation (follows documents upload pattern). Reusable `FileUpload` wrapped by `MediaUploadSection`. Two-`Section` layout matching Documents tab. `MediaGallerySection` with thumbnail grid + `LightboxDialog` + delete. Cloudinary folder: `equus/horses/{horseId}/media/{sourceEntityType}/{timestamp}`.

**Tech Stack:** Next.js 16 App Router, React 19, TypeScript, TailwindCSS, TanStack Query v5, Cloudinary v2 (server), shadcn/ui (Dialog, AlertDialog, Skeleton, Button), next-intl, Zod.

## Global Constraints

- Follow `documentation/page-flow-blueprint.md` — thin server component, loading.tsx with HorsePageSkeleton, client.tsx with Sections
- All API calls use TanStack Query hooks — no raw fetch() in components
- All mutations invalidate related queries on success, show toast on error
- Each section wrapped in `<ErrorBoundary fallbackRender={InlineErrorFallback}>`
- `placeholderData: (prev) => prev` on all queries
- No hardcoded user-facing text — all strings from i18n
- `"use client"` on all components with hooks/event handlers
- Soft-delete only — set `isActive: false`, never hard-delete domain documents
- Files use `@/` path alias for project imports
- Do NOT use `useRef` for DOM manipulation

---

## File Structure

```
Create:
  app/[locale]/horses/[horseId]/media/client.tsx          ← Content assembly
  app/[locale]/horses/[horseId]/media/loading.tsx         ← SSR skeleton
  components/horses/media/media-upload-section.tsx        ← Upload wrapper
  components/horses/media/media-gallery-section.tsx       ← Thumbnail grid
  components/horses/media/lightbox-dialog.tsx             ← Image/video viewer
  app/api/v1/horses/[id]/media/upload/route.ts            ← Multipart upload + record creation
  app/api/v1/horses/[id]/media/[mediaId]/route.ts         ← DELETE endpoint
  tests/lib/services/horseMediaService.test.ts            ← Service tests

Modify:
  hooks/queries/useHorseMedia.ts                          ← Add upload + delete mutations
  lib/services/horseMediaService.ts                       ← Add deleteMedia function
  lib/validations/horseMedia.ts                           ← Add mimeType, fileSizeBytes
  messages/en.json                                        ← Add/update horseMedia keys
  messages/es.json                                        ← Add/update horseMedia keys
  documentation/horseTabs.md                              ← Update Media tab description
  documentation/horses.md                                 ← Add Media endpoints

Delete:
  components/horses/horse-media-page-content.tsx          ← Replaced by client.tsx + sections
```

---

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

---

### Task 2: Update Zod validation schema for media

**Files:**
- Modify: `lib/validations/horseMedia.ts`

**Interfaces:**
- Consumes: None
- Produces: `createMediaSchema` with added `mimeType`, `fileSizeBytes` fields

- [ ] **Step 1: Add fields to the schema**

```typescript
// lib/validations/horseMedia.ts — replace entire file

import { z } from "zod";

export const createMediaSchema = z.object({
  type: z.enum(["image", "video", "other"]),
  url: z.string().url(),
  thumbnailUrl: z.string().url().optional(),
  title: z.string().max(200).optional(),
  description: z.string().max(2000).optional(),
  mimeType: z.string().optional(),
  fileSizeBytes: z.number().int().positive().optional(),
  visibilityMode: z.enum(["owner", "entities", "public"]).optional().default("owner"),
  visibilityEntityIds: z.array(z.string()).optional(),
});
```

- [ ] **Step 2: Run full test suite to check for regressions**

Run: `npx vitest run`
Expected: All existing tests pass

- [ ] **Step 3: Commit**

```bash
git add lib/validations/horseMedia.ts
git commit -m "feat: add mimeType and fileSizeBytes to createMediaSchema"
```

---

### Task 3: Create media upload API route

**Files:**
- Create: `app/api/v1/horses/[id]/media/upload/route.ts`

**Interfaces:**
- Produces: `POST /api/v1/horses/[id]/media/upload` — multipart upload with Cloudinary folder `equus/horses/{horseId}/media/{sourceEntityType}/{timestamp}`, creates HorseMedia record, returns `{ media: PublicMedia[] }`

- [ ] **Step 1: Create the route file**

```typescript
// app/api/v1/horses/[id]/media/upload/route.ts

import connectDb from "@/lib/db.ts";
import { withRoute, ok } from "@/lib/api/response.ts";
import { ApiError } from "@/lib/api/errors.ts";
import { requireAuthFromRequest } from "@/lib/auth/requireAuth.ts";
import configureCloudinary from "@/lib/cloudinary/cloudinaryConfig.ts";
import { buildCloudinaryPath } from "@/lib/cloudinary/constants.ts";
import { v2 as cloudinary } from "cloudinary";
import * as mediaService from "@/lib/services/horseMediaService.ts";

type RouteContext = { params: Promise<{ id: string }> };

export async function POST(request: Request, context: RouteContext) {
  return withRoute(async () => {
    await connectDb();
    const session = await requireAuthFromRequest(request);
    const { id: horseId } = await context.params;

    configureCloudinary();

    const formData = await request.formData();
    const files = formData.getAll("files") as File[];
    const sourceEntityType = (formData.get("sourceEntityType") as string) || "horse";
    const sourceEntityId = formData.get("sourceEntityId") as string | undefined;

    if (files.length === 0) {
      throw new ApiError(400, "No files provided", "VALIDATION_ERROR");
    }

    const maxSize = 10 * 1024 * 1024;
    const allowedTypes = ["image/", "video/"];

    for (const file of files) {
      if (file.size > maxSize) {
        throw new ApiError(400, `File ${file.name} exceeds 10MB limit`, "FILE_TOO_LARGE");
      }
      const isAllowed = allowedTypes.some((t) => file.type.startsWith(t));
      if (!isAllowed) {
        throw new ApiError(400, `File ${file.name} has an unsupported type`, "INVALID_FILE_TYPE");
      }
    }

    const basePath = buildCloudinaryPath(`/horses/${horseId}/media/${sourceEntityType}`);

    const results = await Promise.all(
      files.map(async (file) => {
        const buffer = Buffer.from(await file.arrayBuffer());
        const dataUri = `data:${file.type};base64,${buffer.toString("base64")}`;
        const publicId = `${basePath}/${Date.now()}`;

        const result = await cloudinary.uploader.upload(dataUri, {
          invalidate: true,
          folder: basePath,
          public_id: publicId,
          resource_type: "auto",
        });

        const isVideo = file.type.startsWith("video/");
        const thumbnailUrl = isVideo
          ? result.secure_url.replace(/\.\w+$/, ".jpg")
          : undefined;

        const visibilityMode = sourceEntityType === "horse" ? "public" : "owner";

        return mediaService.createMedia(session.id, horseId, {
          type: isVideo ? "video" : "image",
          url: result.secure_url,
          thumbnailUrl,
          title: file.name.replace(/\.[^.]+$/, ""),
          mimeType: file.type,
          fileSizeBytes: file.size,
          sourceEntityType,
          sourceEntityId,
          visibilityMode,
        });
      }),
    );

    return ok({ media: results }, 201);
  });
}
```

- [ ] **Step 2: Commit**

```bash
git add app/api/v1/horses/[id]/media/upload/route.ts
git commit -m "feat: add POST media/upload route with Cloudinary folder organization"
```

---

### Task 4: Add upload + delete mutations to useHorseMedia hook

**Files:**
- Modify: `hooks/queries/useHorseMedia.ts`

**Interfaces:**
- Consumes: `fetchWithAuth`, `parseApiResponse` from `@/lib/api/fetchWithAuth`, `queryKeys` from `@/lib/api/queryKeys`, `PublicMedia` from `@/lib/services/horseMediaService`
- Produces:
  - `useHorseMedia(horseId)` — existing query, add `placeholderData`
  - `useUploadHorseMedia(horseId)` — sends FormData to `POST .../media/upload`
  - `useDeleteHorseMedia(horseId)` — sends JSON to `DELETE .../media/:mediaId`

- [ ] **Step 1: Replace the hook file**

```typescript
// hooks/queries/useHorseMedia.ts — replace entire file

"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { fetchWithAuth, parseApiResponse } from "@/lib/api/fetchWithAuth";
import { queryKeys } from "@/lib/api/queryKeys";
import type { PublicMedia } from "@/lib/services/horseMediaService";

async function fetchMedia(horseId: string): Promise<PublicMedia[]> {
  const res = await fetchWithAuth(`/api/v1/horses/${encodeURIComponent(horseId)}/media`);
  const data = await parseApiResponse<{ media: PublicMedia[] }>(res);
  return data.media;
}

export function useHorseMedia(horseId: string) {
  return useQuery({
    queryKey: [...queryKeys.horses.all, horseId, "media"],
    queryFn: () => fetchMedia(horseId),
    enabled: !!horseId,
    placeholderData: (previousData) => previousData,
  });
}

type UploadMediaInput = {
  files: File[];
  sourceEntityType: string;
  sourceEntityId?: string;
};

export function useUploadHorseMedia(horseId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ files, sourceEntityType, sourceEntityId }: UploadMediaInput): Promise<PublicMedia[]> => {
      const formData = new FormData();
      for (const file of files) {
        formData.append("files", file);
      }
      formData.append("sourceEntityType", sourceEntityType);
      if (sourceEntityId) {
        formData.append("sourceEntityId", sourceEntityId);
      }

      const res = await fetch(
        `/api/v1/horses/${encodeURIComponent(horseId)}/media/upload`,
        {
          method: "POST",
          body: formData,
          credentials: "include",
        },
      );
      const data = await parseApiResponse<{ media: PublicMedia[] }>(res);
      return data.media;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: [...queryKeys.horses.all, horseId, "media"],
      });
    },
  });
}

export function useDeleteHorseMedia(horseId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      mediaId,
      storagePublicId,
    }: {
      mediaId: string;
      storagePublicId?: string | null;
    }) => {
      const res = await fetchWithAuth(
        `/api/v1/horses/${encodeURIComponent(horseId)}/media/${encodeURIComponent(mediaId)}`,
        {
          method: "DELETE",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ storagePublicId }),
        },
      );
      return parseApiResponse<{ deleted: boolean }>(res);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: [...queryKeys.horses.all, horseId, "media"],
      });
    },
  });
}
```

- [ ] **Step 2: Run type check**

Run: `npx tsc --noEmit`
Expected: No type errors in this file

- [ ] **Step 3: Commit**

```bash
git add hooks/queries/useHorseMedia.ts
git commit -m "feat: add upload and delete mutations to useHorseMedia hook"
```

---

### Task 5: Create DELETE API route for media

**Files:**
- Create: `app/api/v1/horses/[id]/media/[mediaId]/route.ts`

**Interfaces:**
- Consumes: `connectDb`, `withRoute`, `ok` from response helpers, `requireAuthFromRequest` from auth, `deleteMedia`/`extractStoragePublicId` from `horseMediaService`
- Produces: DELETE endpoint at `/api/v1/horses/:id/media/:mediaId`

- [ ] **Step 1: Create the route file**

```typescript
// app/api/v1/horses/[id]/media/[mediaId]/route.ts

import connectDb from "@/lib/db.ts";
import { withRoute, ok } from "@/lib/api/response.ts";
import { requireAuthFromRequest } from "@/lib/auth/requireAuth.ts";
import * as mediaService from "@/lib/services/horseMediaService.ts";

type RouteContext = { params: Promise<{ mediaId: string }> };

export async function DELETE(request: Request, context: RouteContext) {
  return withRoute(async () => {
    await connectDb();
    await requireAuthFromRequest(request);
    const { mediaId } = await context.params;
    const { storagePublicId } = await request.json().catch(() => ({}));
    await mediaService.deleteMedia(mediaId, storagePublicId);
    return ok({ deleted: true });
  });
}
```

- [ ] **Step 2: Verify route structure**

Run: `Get-ChildItem -Recurse "app/api/v1/horses" | Where-Object { $_.Name -eq "media" -or $_.Name -like "*mediaId*" } | Select-Object FullName`
Expected: Shows the new `[mediaId]/route.ts` file inside the media route segment

- [ ] **Step 3: Commit**

```bash
git add app/api/v1/horses/[id]/media/[mediaId]/route.ts
git commit -m "feat: add DELETE endpoint for horse media"
```

---

### Task 6: Create media page loading.tsx

**Files:**
- Create: `app/[locale]/horses/[horseId]/media/loading.tsx`

**Interfaces:**
- Consumes: `HorsePageSkeleton` from `@/components/horses/horse-page-skeleton.tsx`
- Produces: SSR skeleton for the media page route segment

- [ ] **Step 1: Create loading.tsx**

```tsx
// app/[locale]/horses/[horseId]/media/loading.tsx

import { HorsePageSkeleton } from "@/components/horses/horse-page-skeleton.tsx";

export default function MediaLoading() {
  return <HorsePageSkeleton />;
}
```

- [ ] **Step 2: Commit**

```bash
git add app/[locale]/horses/[horseId]/media/loading.tsx
git commit -m "feat: add loading.tsx skeleton for horse media page"
```

---

### Task 7: Create media page client.tsx (content assembly)

**Files:**
- Create: `app/[locale]/horses/[horseId]/media/client.tsx`

**Interfaces:**
- Consumes: `HorsePageShell`, `Section`, `InlineErrorFallback`, `MediaUploadSection`, `MediaGallerySection`, `useTranslations`
- Produces: `MediaContent` component — page content assembly

- [ ] **Step 1: Create client.tsx**

```tsx
// app/[locale]/horses/[horseId]/media/client.tsx

"use client";

import { useTranslations } from "next-intl";
import { ErrorBoundary } from "react-error-boundary";

import { HorsePageShell } from "@/components/horses/horse-page-shell.tsx";
import { Section } from "@/components/shared/section.tsx";
import { InlineErrorFallback } from "@/components/errors/inline-error-fallback.tsx";
import { MediaUploadSection } from "@/components/horses/media/media-upload-section.tsx";
import { MediaGallerySection } from "@/components/horses/media/media-gallery-section.tsx";

type MediaContentProps = {
  horseId: string;
};

export function MediaContent({ horseId }: MediaContentProps) {
  const t = useTranslations("horseMedia");

  return (
    <HorsePageShell horseId={horseId}>
      <Section
        title={t("uploadTitle")}
        description={t("uploadDescription")}
        className="shrink-0"
      >
        <ErrorBoundary fallbackRender={(p) => <InlineErrorFallback {...p} />}>
          <MediaUploadSection
            horseId={horseId}
            sourceEntityType="horse"
          />
        </ErrorBoundary>
      </Section>

      <Section title={t("galleryTitle")} className="flex-1">
        <ErrorBoundary fallbackRender={(p) => <InlineErrorFallback {...p} />}>
          <MediaGallerySection horseId={horseId} />
        </ErrorBoundary>
      </Section>
    </HorsePageShell>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add app/[locale]/horses/[horseId]/media/client.tsx
git commit -m "feat: add media page client.tsx content assembly"
```

---

### Task 8: Create MediaUploadSection component

**Files:**
- Create: `components/horses/media/media-upload-section.tsx`

**Interfaces:**
- Consumes: `FileUpload`, `UploadedFileState` from `@/components/shared/file-upload.tsx`, `useUploadHorseMedia` from hooks, `useAppToast`, `useTranslations`, shadcn `Button`, `Input`, `Label`
- Produces: `MediaUploadSection({ horseId, sourceEntityType, sourceEntityId?, cloudinaryFolder })` — upload area with drag-and-drop + upload button

- [ ] **Step 1: Create the component**

```tsx
// components/horses/media/media-upload-section.tsx

"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Upload, Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { FileUpload, type UploadedFileState } from "@/components/shared/file-upload.tsx";
import { useUploadHorseMedia } from "@/hooks/queries/useHorseMedia.ts";
import { useAppToast } from "@/hooks/use-app-toast.ts";

type MediaUploadSectionProps = {
  horseId: string;
  sourceEntityType: string;
  sourceEntityId?: string;
};

export function MediaUploadSection({
  horseId,
  sourceEntityType,
  sourceEntityId,
}: MediaUploadSectionProps) {
  const t = useTranslations("horseMedia");
  const toast = useAppToast();
  const [files, setFiles] = useState<UploadedFileState[]>([]);
  const [isUploading, setIsUploading] = useState(false);

  const uploadMutation = useUploadHorseMedia(horseId);

  async function handleUpload() {
    const pendingFiles = files.filter((f) => f.status === "pending");
    if (pendingFiles.length === 0) return;

    setIsUploading(true);

    setFiles((prev) =>
      prev.map((f) =>
        f.status === "pending" ? { ...f, status: "uploading" as const } : f,
      ),
    );

    uploadMutation.mutate(
      {
        files: pendingFiles.map((f) => f.file),
        sourceEntityType,
        sourceEntityId,
      },
      {
        onSuccess: () => {
          toast.success(t("uploadSuccess"));
          setFiles([]);
        },
        onError: () => {
          toast.error(t("uploadError"));
          setFiles((prev) =>
            prev.map((f) =>
              f.status === "uploading"
                ? { ...f, status: "error" as const, error: t("uploadError") }
                : f,
            ),
          );
        },
        onSettled: () => {
          setIsUploading(false);
        },
      },
    );
  }

  const hasPendingFiles = files.some((f) => f.status === "pending");

  return (
    <div className="space-y-4">
      <FileUpload
        value={files}
        onChange={setFiles}
        accept="image/*,video/*"
        maxFiles={10}
        maxSizeBytes={10 * 1024 * 1024}
        disabled={isUploading}
        uploading={isUploading}
      />
      {hasPendingFiles && (
        <Button onClick={handleUpload} disabled={isUploading}>
          {isUploading ? (
            <>
              <Loader2 className="mr-1 h-4 w-4 animate-spin" />
              {t("uploading")}
            </>
          ) : (
            <>
              <Upload className="mr-1 h-4 w-4" />
              {t("uploadButton")}
            </>
          )}
        </Button>
      )}
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add components/horses/media/media-upload-section.tsx
git commit -m "feat: add MediaUploadSection with drag-and-drop upload"
```

---

### Task 9: Create LightboxDialog component

**Files:**
- Create: `components/horses/media/lightbox-dialog.tsx`

**Interfaces:**
- Consumes: `PublicMedia` from `@/lib/services/horseMediaService`, shadcn `Dialog` components, `useTranslations`
- Produces: `LightboxDialog({ items, currentIndex, open, onOpenChange, onPrevious, onNext })` — full-screen media viewer with prev/next navigation

- [ ] **Step 1: Create the component**

```tsx
// components/horses/media/lightbox-dialog.tsx

"use client";

import { useTranslations } from "next-intl";
import { ChevronLeft, ChevronRight, X } from "lucide-react";

import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import type { PublicMedia } from "@/lib/services/horseMediaService";

type LightboxDialogProps = {
  items: PublicMedia[];
  currentIndex: number;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onPrevious: () => void;
  onNext: () => void;
};

export function LightboxDialog({
  items,
  currentIndex,
  open,
  onOpenChange,
  onPrevious,
  onNext,
}: LightboxDialogProps) {
  const t = useTranslations("horseMedia");
  const item = items[currentIndex];
  const hasPrev = currentIndex > 0;
  const hasNext = currentIndex < items.length - 1;

  if (!item) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[90vw] max-h-[90vh] p-0 gap-0 bg-black/95 border-0">
        <DialogTitle className="sr-only">
          {item.title ?? t("addMedia")}
        </DialogTitle>
        <DialogDescription className="sr-only">
          {item.description ?? ""}
        </DialogDescription>

        <div className="relative flex items-center justify-center w-full h-[80vh]">
          {hasPrev && (
            <Button
              variant="ghost"
              size="icon"
              className="absolute left-2 z-10 text-white hover:bg-white/20 rounded-full"
              onClick={onPrevious}
            >
              <ChevronLeft className="size-8" />
            </Button>
          )}

          {item.type === "video" ? (
            <video
              src={item.url}
              controls
              className="max-w-full max-h-full object-contain"
              autoPlay
            />
          ) : (
            <img
              src={item.thumbnailUrl ?? item.url}
              alt={item.title ?? ""}
              className="max-w-full max-h-full object-contain"
            />
          )}

          {hasNext && (
            <Button
              variant="ghost"
              size="icon"
              className="absolute right-2 z-10 text-white hover:bg-white/20 rounded-full"
              onClick={onNext}
            >
              <ChevronRight className="size-8" />
            </Button>
          )}

          <Button
            variant="ghost"
            size="icon"
            className="absolute top-2 right-2 z-10 text-white hover:bg-white/20 rounded-full"
            onClick={() => onOpenChange(false)}
          >
            <X className="size-6" />
          </Button>
        </div>

        <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-black/80 to-transparent p-4">
          {item.title && (
            <p className="text-sm font-medium text-white">{item.title}</p>
          )}
          {item.description && (
            <p className="text-xs text-white/70 mt-1">{item.description}</p>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add components/horses/media/lightbox-dialog.tsx
git commit -m "feat: add LightboxDialog for full-screen media viewing"
```

---

### Task 10: Create MediaGallerySection component

**Files:**
- Create: `components/horses/media/media-gallery-section.tsx`

**Interfaces:**
- Consumes: `useHorseMedia`, `useDeleteHorseMedia` from hooks, `LightboxDialog`, `extractStoragePublicId` from service, shadcn `Skeleton`, `AlertDialog`, `useAppToast`, `useTranslations`
- Produces: `MediaGallerySection({ horseId })` — thumbnail grid with hover delete, lightbox on click

- [ ] **Step 1: Create the component**

```tsx
// components/horses/media/media-gallery-section.tsx

"use client";

import { useState, useCallback } from "react";
import { useTranslations } from "next-intl";
import { Trash2, Play, ImageIcon } from "lucide-react";

import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useHorseMedia, useDeleteHorseMedia } from "@/hooks/queries/useHorseMedia.ts";
import { useAppToast } from "@/hooks/use-app-toast.ts";
import { LightboxDialog } from "@/components/horses/media/lightbox-dialog.tsx";
import { extractStoragePublicId } from "@/lib/services/horseMediaService.ts";

type MediaGallerySectionProps = {
  horseId: string;
};

export function MediaGallerySection({ horseId }: MediaGallerySectionProps) {
  const t = useTranslations("horseMedia");
  const toast = useAppToast();
  const { data: media = [], isPending } = useHorseMedia(horseId);
  const deleteMutation = useDeleteHorseMedia(horseId);

  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);

  const openLightbox = useCallback((index: number) => setLightboxIndex(index), []);
  const closeLightbox = useCallback(() => setLightboxIndex(null), []);

  const goPrevious = useCallback(() => {
    setLightboxIndex((prev) => (prev !== null && prev > 0 ? prev - 1 : prev));
  }, []);

  const goNext = useCallback(() => {
    setLightboxIndex((prev) =>
      prev !== null && prev < media.length - 1 ? prev + 1 : prev,
    );
  }, [media.length]);

  function handleDelete() {
    if (!deleteTarget) return;
    const item = media.find((m) => m.id === deleteTarget);
    const storagePublicId = item?.url
      ? extractStoragePublicId(item.thumbnailUrl ?? item.url)
      : null;

    deleteMutation.mutate(
      { mediaId: deleteTarget, storagePublicId },
      {
        onSuccess: () => {
          toast.success(t("deleteSuccess"));
          setDeleteTarget(null);
          if (lightboxIndex !== null && lightboxIndex >= media.length - 1) {
            closeLightbox();
          }
        },
        onError: () => toast.error(t("deleteError")),
      },
    );
  }

  if (isPending) {
    return (
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4">
        {Array.from({ length: 8 }).map((_, i) => (
          <Skeleton key={i} className="aspect-square w-full rounded-lg" />
        ))}
      </div>
    );
  }

  if (media.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <ImageIcon className="size-12 text-muted-foreground/40 mb-3" />
        <p className="text-sm text-muted-foreground">{t("noMedia")}</p>
      </div>
    );
  }

  return (
    <>
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4">
        {media.map((item, index) => (
          <div
            key={item.id}
            className="group relative aspect-square overflow-hidden rounded-lg border cursor-pointer"
            onClick={() => openLightbox(index)}
          >
            {item.type === "video" && (
              <div className="absolute inset-0 z-10 flex items-center justify-center">
                <div className="flex items-center justify-center size-12 rounded-full bg-black/50">
                  <Play className="size-6 text-white ml-0.5" />
                </div>
              </div>
            )}

            {item.type === "image" || item.thumbnailUrl ? (
              <img
                src={item.thumbnailUrl ?? item.url}
                alt={item.title ?? ""}
                className="size-full object-cover transition-transform group-hover:scale-105"
                loading="lazy"
              />
            ) : (
              <div className="flex size-full items-center justify-center bg-muted">
                <ImageIcon className="size-8 text-muted-foreground" />
              </div>
            )}

            <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/60 to-transparent p-2">
              {item.title && (
                <p className="text-xs text-white truncate">{item.title}</p>
              )}
            </div>

            <Button
              variant="ghost"
              size="icon"
              className="absolute top-1 right-1 z-20 size-7 rounded-full bg-black/50 text-white opacity-0 transition-opacity group-hover:opacity-100 hover:bg-black/70 hover:text-white"
              onClick={(e) => {
                e.stopPropagation();
                setDeleteTarget(item.id);
              }}
            >
              <Trash2 className="size-3.5" />
            </Button>
          </div>
        ))}
      </div>

      {lightboxIndex !== null && (
        <LightboxDialog
          items={media}
          currentIndex={lightboxIndex}
          open={lightboxIndex !== null}
          onOpenChange={closeLightbox}
          onPrevious={goPrevious}
          onNext={goNext}
        />
      )}

      <AlertDialog
        open={deleteTarget !== null}
        onOpenChange={(open) => {
          if (!open) setDeleteTarget(null);
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t("deleteConfirm")}</AlertDialogTitle>
            <AlertDialogDescription>
              {t("deleteConfirmDescription")}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t("cancel")}</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={deleteMutation.isPending}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleteMutation.isPending ? (
                <span className="flex items-center gap-1">
                  <span className="size-3 animate-spin rounded-full border-2 border-current border-t-transparent" />
                  {t("delete")}
                </span>
              ) : (
                t("delete")
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
```

- [ ] **Step 2: Check that `extractStoragePublicId` is exported from service**

Open `lib/services/horseMediaService.ts` and verify the function is exported. If not, ensure `export function extractStoragePublicId` is present (added in Task 1).

- [ ] **Step 3: Commit**

```bash
git add components/horses/media/media-gallery-section.tsx
git commit -m "feat: add MediaGallerySection with thumbnail grid and lightbox"
```

---

### Task 11: Update i18n messages (en.json + es.json)

**Files:**
- Modify: `messages/en.json`
- Modify: `messages/es.json`

**Interfaces:**
- Consumes: None
- Produces: Updated `horseMedia` namespace in both locale files

- [ ] **Step 1: Find the existing horseMedia blocks and replace them**

In `messages/en.json`, find the `horseMedia` object (around line 965) and replace it:

```json
"horseMedia": {
    "title": "Media & Gallery",
    "description": "Photos and videos of this horse.",
    "uploadTitle": "Upload Media",
    "uploadDescription": "Drag and drop photos or videos. Supports JPG, PNG, GIF, MP4, WebM up to 10MB.",
    "galleryTitle": "Gallery",
    "noMedia": "No media yet. Upload some photos or videos above.",
    "uploadMedia": "Upload",
    "addMedia": "Add media",
    "uploadButton": "Upload",
    "uploading": "Uploading...",
    "uploadSuccess": "Media uploaded successfully.",
    "uploadError": "Failed to upload media.",
    "delete": "Delete",
    "deleteConfirm": "Delete this media?",
    "deleteConfirmDescription": "This action cannot be undone. The file will be removed from the gallery and Cloudinary storage.",
    "deleteSuccess": "Media deleted.",
    "deleteError": "Failed to delete media.",
    "previous": "Previous",
    "next": "Next",
    "close": "Close"
}
```

In `messages/es.json`, find the `horseMedia` object (around line 965) and replace it:

```json
"horseMedia": {
    "title": "Multimedia y Galería",
    "description": "Fotos y videos de este caballo.",
    "uploadTitle": "Subir multimedia",
    "uploadDescription": "Arrastra y suelta fotos o videos. Formatos: JPG, PNG, GIF, MP4, WebM hasta 10MB.",
    "galleryTitle": "Galería",
    "noMedia": "Aún no hay contenido multimedia. Sube fotos o videos arriba.",
    "uploadMedia": "Subir",
    "addMedia": "Añadir multimedia",
    "uploadButton": "Subir",
    "uploading": "Subiendo...",
    "uploadSuccess": "Multimedia subido correctamente.",
    "uploadError": "Error al subir multimedia.",
    "delete": "Eliminar",
    "deleteConfirm": "¿Eliminar este archivo?",
    "deleteConfirmDescription": "Esta acción no se puede deshacer. El archivo se eliminará de la galería y del almacenamiento.",
    "deleteSuccess": "Multimedia eliminado.",
    "deleteError": "Error al eliminar multimedia.",
    "previous": "Anterior",
    "next": "Siguiente",
    "close": "Cerrar"
}
```

- [ ] **Step 2: Verify JSON validity**

Run: `npx eslint messages/en.json messages/es.json --max-warnings=0 2>$null; node -e "JSON.parse(require('fs').readFileSync('messages/en.json','utf8')); JSON.parse(require('fs').readFileSync('messages/es.json','utf8')); console.log('Valid JSON')"`
Expected: "Valid JSON"

- [ ] **Step 3: Commit**

```bash
git add messages/en.json messages/es.json
git commit -m "feat: add horseMedia i18n keys for upload, gallery, lightbox, and delete"
```

---

### Task 12: Update page.tsx to use new client.tsx and delete old content

**Files:**
- Modify: `app/[locale]/horses/[horseId]/media/page.tsx`
- Delete: `components/horses/horse-media-page-content.tsx`

**Interfaces:**
- Consumes: `MediaContent` from `./client`
- Produces: Updated page.tsx importing from client.tsx instead of old component

- [ ] **Step 1: Update page.tsx**

```tsx
// app/[locale]/horses/[horseId]/media/page.tsx — replace entire file

import type { Metadata } from "next";
import { generatePrivateMetadata } from "@/lib/seo/metadata-factory.ts";
import { MediaContent } from "./client";

type PageProps = { params: Promise<{ horseId: string; locale: string }> };

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { locale } = await params;
  return generatePrivateMetadata(locale, "/horses/[horseId]/media", "metadata.horseMedia");
}

export default async function HorseMediaPage({ params }: PageProps) {
  const { horseId } = await params;
  return <MediaContent horseId={horseId} />;
}
```

- [ ] **Step 2: Delete old component**

```bash
Remove-Item -LiteralPath "components/horses/horse-media-page-content.tsx"
```

- [ ] **Step 3: Verify no remaining imports reference the deleted file**

Run: `rg "horse-media-page-content" --type ts --type tsx`
Expected: No results

- [ ] **Step 4: Commit**

```bash
git add app/[locale]/horses/[horseId]/media/page.tsx
git rm components/horses/horse-media-page-content.tsx
git commit -m "feat: wire new client.tsx into media page, remove old content component"
```

---

### Task 13: Update documentation

**Files:**
- Modify: `documentation/horseTabs.md`
- Modify: `documentation/horses.md`

- [ ] **Step 1: Update horseTabs.md**

In `documentation/horseTabs.md`, change the Media row in the table (line 10):

```markdown
| Media | `/horses/[id]/media` | Public | Upload and view photos and videos. Drag-and-drop upload with thumbnail gallery and lightbox viewer. |
```

- [ ] **Step 2: Update horses.md**

In `documentation/horses.md`, add Media endpoints to the endpoints table after line 18. Insert after the existing `GET /api/v1/horses/:id` row:

```markdown
| `GET` | `/api/v1/horses/:id/media` | List media items (images/videos) for a horse |
| `POST` | `/api/v1/horses/:id/media` | Create a media record (url, type, title, etc.) |
| `DELETE` | `/api/v1/horses/:id/media/:mediaId` | Delete a media record + Cloudinary file |
```

Also add a Media section at the end of the file (after line 120):

```markdown
### Horse media (`/horses/[horseId]/media`)

Media gallery with drag-and-drop upload. Two-section layout: upload section on top, thumbnail gallery below.

- Server component: `app/[locale]/horses/[horseId]/media/page.tsx`
- Client assembly: `app/[locale]/horses/[horseId]/media/client.tsx`
- Upload component: `components/horses/media/media-upload-section.tsx` — wraps shared `FileUpload` with Cloudinary upload + HorseMedia record creation
- Gallery component: `components/horses/media/media-gallery-section.tsx` — thumbnail grid + lightbox dialog + delete
- Hooks: `hooks/queries/useHorseMedia.ts` — `useHorseMedia`, `useUploadHorseMedia`, `useDeleteHorseMedia`
- Service: `lib/services/horseMediaService.ts` — `listMedia`, `createMedia`, `deleteMedia`, `extractStoragePublicId`
- Model: `models/HorseMedia.ts` — `type` (image/video), `url`, `thumbnailUrl`, `sourceEntityType`, `sourceEntityId`, `visibilityMode`
- Upload: `POST /api/v1/horses/:id/media/upload` (multipart + Cloudinary folder + record creation)
- i18n: `horseMedia` namespace

**Cloudinary folder structure:** `horses/{horseId}/media/{sourceEntityType}/`
**Visibility rule:** Owner-uploaded media defaults to public; entity-uploaded media defaults to owner-only.
```

- [ ] **Step 3: Commit**

```bash
git add documentation/horseTabs.md documentation/horses.md
git commit -m "docs: update horseTabs and horses docs for new media tab"
```

---

### Task 14: Final verification — lint, typecheck, build

**Files:** None (verification only)

- [ ] **Step 1: Run lint**

Run: `npx eslint . --max-warnings=0` (from equus folder)
Expected: No errors

- [ ] **Step 2: Run type check**

Run: `npx tsc --noEmit`
Expected: No type errors

- [ ] **Step 3: Run full test suite**

Run: `npx vitest run`
Expected: All tests pass (including the new horseMediaService test from Task 1)

- [ ] **Step 4: Build check**

Run: `npx next build`
Expected: Successful build with no errors

- [ ] **Step 5: Commit any remaining changes**

```bash
git status
git add -A
git commit -m "chore: final lint, type, and test fixes for media tab rebuild"
```
