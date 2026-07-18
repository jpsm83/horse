# Media Tab Rebuild — Design Spec

**Date:** 2026-07-18
**Status:** Draft
**Scope:** Rebuild the horse Media tab (`/horses/[horseId]/media`) following the page flow blueprint, with drag-and-drop upload, thumbnail gallery, lightbox viewer, and Cloudinary folder organization.

---

## 1. Problem & Context

The current Media tab (`components/horses/horse-media-page-content.tsx`) is a minimal read-only gallery with no upload capability. It does not follow the page flow blueprint: no `<Section>` layout, no `ErrorBoundary`, no skeleton, no upload flow. The tab needs a complete rebuild.

The Documents tab (`/horses/[horseId]/documents`) serves as the reference implementation with its two-section layout (upload on top, data below), ErrorBoundary-per-section, and TanStack Query hooks.

The project already has:
- A reusable `FileUpload` component (`components/shared/file-upload.tsx`) with drag-and-drop, preview grid, status tracking
- A generic Cloudinary upload API (`POST /api/v1/media/upload`)
- A `HorseMedia` Mongoose model with `type`, `url`, `thumbnailUrl`, `sourceEntityType`, `sourceEntityId`, `visibilityMode` fields
- A `horseMediaService` with `listMedia` and `createMedia` functions

---

## 2. Architecture

### 2.1 Component Tree

```
Server Component (page.tsx)
  └── client.tsx ("use client")
       └── HorsePageShell (tabs + auth gating)
            ├── Section (shrink-0) "Upload Media"
            │   └── ErrorBoundary → InlineErrorFallback
            │        └── MediaUploadSection
            │             └── FileUpload (shared, drag-and-drop)
            └── Section (flex-1) "Gallery"
                └── ErrorBoundary → InlineErrorFallback
                     └── MediaGallerySection
                          ├── isPending → <Skeleton>
                          ├── empty → "No media yet"
                          └── resolved → thumbnail grid
                               └── click → LightboxDialog
```

### 2.2 Two-Layer Upload Design

**Layer 1 — `FileUpload` (shared, unchanged):**
Pure file selector. Drag-and-drop zone, file validation (type/size), preview grid, status indicators. No opinion about where files go or what happens after upload.

**Layer 2 — `MediaUploadSection` (new):**
Wraps `FileUpload`. Adds metadata form (title, description). Handles the upload pipeline: Cloudinary upload → HorseMedia DB record creation. Configurable via props for reuse by different entity types.

```typescript
type MediaUploadSectionProps = {
  horseId: string;
  sourceEntityType: string;     // "horse", "vet", "stable", etc.
  sourceEntityId?: string;      // entity's ObjectId
  cloudinaryFolder: string;     // e.g., "horses/{horseId}/media/horse"
  acceptedTypes?: string;       // defaults to "image/*,video/*"
  maxFiles?: number;            // defaults to 10
  maxSizeBytes?: number;        // defaults to 10MB
};
```

### 2.3 Cloudinary Folder Structure

```
horses/{horseId}/
  ├── media/
  │   ├── horse/       (owner/sub-owner uploads)
  │   ├── vet/         (vet uploads)
  │   ├── stable/      (stable uploads)
  │   ├── groomer/     (groomer uploads)
  │   └── ...          (other entity types)
  └── documents/       (existing, unchanged)
```

---

## 3. Upload Flow (Data Flow)

```
1. User drops files into FileUpload
2. Files validated client-side (type, size, count)
3. Preview grid shown with "pending" status
4. User clicks "Upload"
5. FileUpload marks files as "uploading" (spinner overlay)
6. POST /api/v1/horses/{horseId}/media/upload (FormData, multipart)
   → Server validates auth (cookie)
   → Validates file types (image/*, video/*) and sizes (≤10MB)
   → Uploads to Cloudinary: equus/horses/{horseId}/media/{entityType}/{timestamp}
   → Creates HorseMedia record per file with:
     - type: auto-detected from mimeType (image/video)
     - url: from Cloudinary secure_url
     - thumbnailUrl: video → same url with .jpg extension (Cloudinary auto-generates)
     - title: filename without extension
     - mimeType, fileSizeBytes: from file
     - sourceEntityType, sourceEntityId
     - visibilityMode: "public" if sourceEntityType is "horse", else "owner"
   → Returns { media: PublicMedia[] }
7. FileUpload clears, toast success
8. Invalidate media query → gallery refreshes
```

**Visibility rule:** Owner/sub-owner uploads (sourceEntityType = "horse") default to `visibilityMode: "public"`. All other entity uploads (vet, groomer, stable, etc.) default to `visibilityMode: "owner"` — not visible on the public hub.

---

## 4. Media Gallery

### 4.1 Thumbnail Grid

- Responsive grid: 2 columns (mobile), 3 (sm), 4 (md+)
- `aspect-square` containers with `object-cover`
- Images: show `thumbnailUrl ?? url`
- Videos: show `thumbnailUrl` (Cloudinary auto-generated) or video icon placeholder
- Hover overlay: gradient bottom with title, delete button (top-right, icon-only)
- Loading: `<Skeleton>` grid blocks during `isPending`
- Empty: centered icon + message

### 4.2 Lightbox Dialog

- Click thumbnail → opens shadcn `Dialog` (full-screen, dark backdrop)
- Image: `<img>` with `object-contain`, max dimensions
- Video: `<video controls>` element, autoplay on open
- Header: title, description, upload date
- Navigation: prev/next arrows (if multiple items in gallery)
- Close: X button + click-outside + Escape key
- Keyboard: ArrowLeft/ArrowRight for navigation

### 4.3 Delete

- Hover → delete icon button on thumbnail
- Click → confirmation dialog (shadcn `AlertDialog`)
- Confirm → `DELETE /api/v1/horses/{horseId}/media/{mediaId}`
- Cloudinary file deleted from storage
- HorseMedia record soft-deleted (`isActive: false`)
- Toast success/failure
- Invalidate media query

---

## 5. API Changes

### 5.1 New: `POST /api/v1/horses/[id]/media/upload`

```
POST /api/v1/horses/{horseId}/media/upload
Auth: required (cookie)
Content-Type: multipart/form-data
Fields: files (File[], multiple), sourceEntityType (string, default "horse"), sourceEntityId (string, optional)
Response: 201 { media: PublicMedia[] }
```

Follows the documents upload pattern. In one request: validates files → uploads to Cloudinary at `equus/horses/{horseId}/media/{sourceEntityType}/{timestamp}` → creates HorseMedia records → returns media items. Visibility defaults to "public" if sourceEntityType is "horse", otherwise "owner".

### 5.2 Modify: `POST /api/v1/horses/[id]/media`

Add `mimeType`, `fileSizeBytes`, `sourceEntityType`, `sourceEntityId` to the Zod validation schema (already in the Mongoose model, not in the schema).

### 5.3 New: `DELETE /api/v1/horses/[id]/media/[mediaId]`

```
DELETE /api/v1/horses/{horseId}/media/{mediaId}
Auth: required
Response: 200 { media: PublicMedia }
```

- Finds media record by `id` + `horseId`
- Deletes file from Cloudinary using `storagePublicId` (if present)
- Soft-deletes record (`isActive: false`, deactivation audit fields)
- Records audit event

### 5.4 Keep unchanged

- `GET /api/v1/horses/[id]/media` — list media (already exists)
- `POST /api/v1/media/upload` — generic Cloudinary upload (unchanged, used by horse creation flow)

---

## 6. Files Summary

| File | Action | Purpose |
|------|--------|---------|
| `app/[locale]/horses/[horseId]/media/client.tsx` | **New** | Content assembly: HorsePageShell + Sections + ErrorBoundaries |
| `app/[locale]/horses/[horseId]/media/loading.tsx` | **New** | SSR skeleton (mandatory per blueprint) |
| `components/horses/media/media-upload-section.tsx` | **New** | Upload wrapper: FileUpload + metadata form + API calls |
| `components/horses/media/media-gallery-section.tsx` | **New** | Thumbnail grid + delete action |
| `components/horses/media/lightbox-dialog.tsx` | **New** | Full-size image/video viewer with navigation |
| `components/horses/horse-media-page-content.tsx` | **Delete** | Replaced by client.tsx + section components |
| `app/api/v1/horses/[id]/media/upload/route.ts` | **New** | Multipart upload + Cloudinary folder + HorseMedia record creation |
| `app/api/v1/horses/[id]/media/[mediaId]/route.ts` | **New** | DELETE endpoint |
| `lib/services/horseMediaService.ts` | **Modify** | Add `deleteMedia` function |
| `lib/validations/horseMedia.ts` | **Modify** | Add `fileSizeBytes`, `mimeType` to `createMediaSchema` |
| `app/api/v1/horses/[id]/media/[mediaId]/route.ts` | **New** | DELETE endpoint |
| `messages/en.json` | **Modify** | Add/update `horseMedia` namespace |
| `messages/es.json` | **Modify** | Add/update `horseMedia` namespace |

---

## 7. i18n Keys (`horseMedia` namespace)

```json
{
  "uploadTitle": "Upload Media",
  "uploadDescription": "Drag and drop photos or videos. Supports JPG, PNG, GIF, MP4, WebM up to 10MB.",
  "galleryTitle": "Gallery",
  "title": "Title (optional)",
  "description": "Description (optional)",
  "dropFiles": "Drop files here or click to browse",
  "maxFilesInfo": "{count} files remaining",
  "uploading": "Uploading...",
  "uploadSuccess": "Media uploaded successfully.",
  "uploadError": "Failed to upload media.",
  "delete": "Delete",
  "deleteConfirm": "Delete this media?",
  "deleteConfirmDescription": "This action cannot be undone. The file will be removed from the gallery and Cloudinary storage.",
  "deleteSuccess": "Media deleted.",
  "deleteError": "Failed to delete media.",
  "noMedia": "No media yet. Upload some photos or videos above.",
  "previous": "Previous",
  "next": "Next",
  "close": "Close",
  "uploadButton": "Upload",
  "cancel": "Cancel"
}
```

Existing keys to keep: `"title": "Media & Gallery"`, `"description": "Photos and videos of this horse."`, `"addMedia": "Add media"`, `"uploadMedia": "Upload"`

---

## 8. Error Handling

- Each Section's children wrapped in `<ErrorBoundary fallbackRender={InlineErrorFallback}>`
- Section headers (title + visibility toggle) survive child crashes
- Upload failures: toast error, files remain in UI with error status
- Delete failures: toast error, item stays in gallery
- Gallery query failure: `InlineErrorFallback` with retry button inside Section

---

## 9. Documentation Updates

Files to update as part of implementation:

| File | Changes |
|------|---------|
| `documentation/horseTabs.md` | Update Media tab description to reflect upload + gallery |
| `documentation/horses.md` | Add Media endpoints (`GET`, `POST`, `DELETE`) to endpoints table |
| `documentation/page-flow-blueprint.md` | No changes — Media tab now follows this blueprint |

---

## 10. Out of Scope

- Video thumbnail generation (Cloudinary auto-handles via transformations)
- Media visibility toggle per item (future: owner can override visibility)
- Batch metadata editing
- Media reordering / sorting
- Other entity upload flows (vet, groomer, stable) — the component is designed for reuse but those integrations are separate tasks
