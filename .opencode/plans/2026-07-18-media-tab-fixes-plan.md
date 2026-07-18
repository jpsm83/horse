# Media Tab Fixes — Implementation Plan

**Date:** 2026-07-18
**Goal:** Fix Cloudinary delete bugs (documents + media), add visibility toggle per media item, and polish UI details (description layout, delete buttons, lightbox size).

---

## 1. Cloudinary Delete Bugs

### Bug A: Document delete — missing `resource_type` and trusts client for `storagePublicId`

**Root cause 1:** `horseDocumentService.ts:75` calls `cloudinary.uploader.destroy(storagePublicId)` with **no `resource_type` option**. Upload uses `resource_type: "auto"` — PDFs/DOCX get stored as `"raw"`, but delete defaults to `"image"`, silently fails.

**Root cause 2:** `[docId]/route.ts:13` reads `storagePublicId` from the **request body** (client-sent) instead of the **database**. The server should never trust the client for this.

**Fix (2 files):**

`app/api/v1/horses/[id]/documents/[docId]/route.ts` — read from DB first:
```typescript
import { ApiError } from "@/lib/api/errors.ts";
import Document from "@/models/Document.ts";

// Inside DELETE:
const doc = await Document.findById(docId).select("storagePublicId").lean();
if (!doc) throw new ApiError(404, "Document not found", "NOT_FOUND");
await docService.deleteHorseDocument(docId, doc.storagePublicId as string | undefined);
```

`lib/services/horseDocumentService.ts` — add `resource_type`:
```typescript
await cloudinary.uploader
  .destroy(storagePublicId, { resource_type: "auto" })
  .catch(() => {});
```

---

### Bug B: Media — no `storagePublicId` stored in model

**Root cause:** The `HorseMedia` model has no `storagePublicId` field. The upload route never stores `result.public_id`. The delete flow regex-extracts it from the URL, which is fragile (env var mismatch, URL format changes).

**Fix:**

`models/HorseMedia.ts` — add field: `storagePublicId: { type: String }`

`app/api/v1/horses/[id]/media/upload/route.ts` — store at upload: `storagePublicId: result.public_id`

`lib/services/horseMediaService.ts` — add `storagePublicId` to `PublicMedia` type and `toPublic()`.

`lib/services/horseMediaService.ts` — simplify `deleteMedia` to accept `storagePublicId` directly (no URL → regex extraction).

`app/api/v1/horses/[id]/media/[mediaId]/route.ts` — read `storagePublicId` from DB record.

`tests/lib/services/horseMediaService.test.ts` — update tests for new deleteMedia signature (pass storagePublicId directly).

---

## 2. Visibility Toggle (isVisibleOnHub)

### Model — add boolean field

`models/HorseMedia.ts` — add: `isVisibleOnHub: { type: Boolean, default: true }`

### Upload default

`app/api/v1/horses/[id]/media/upload/route.ts` — set: `isVisibleOnHub: sourceEntityType === "horse"` (owner = visible, entities = hidden)

### Service type update

`lib/services/horseMediaService.ts` `PublicMedia` — add: `isVisibleOnHub: boolean` and in `toPublic()`.

### Visibility PATCH endpoint

New file: `app/api/v1/horses/[id]/media/[mediaId]/visibility/route.ts`

```
PATCH /api/v1/horses/{horseId}/media/{mediaId}/visibility
Auth: required
Body: { isVisibleOnHub: boolean }
Response: 200 { media: PublicMedia }
```

Finds media by ID → updates `isVisibleOnHub` → returns updated record.

### Hook mutation

`hooks/queries/useHorseMedia.ts` — add `useToggleMediaVisibility(horseId)` mutation that calls the PATCH endpoint and invalidates the media query.

### UI — visibility icon on gallery thumbnails

`components/horses/media/media-gallery-section.tsx`:
- Add `Eye`/`EyeOff` icon button next to the delete button (top-left corner)
- `Eye` shown when `isVisibleOnHub === true`, on hover click toggles OFF
- `EyeOff` shown when `isVisibleOnHub === false`, on hover click toggles ON
- Same sizing as delete button, `bg-primary/70` color
- Stop click propagation

### i18n

`messages/en.json` + `messages/es.json` — add `"visibilityOn": "Visible on Hub"`, `"visibilityOff": "Hidden from Hub"` (with Spanish equivalents).

---

## 3. UI Polish

### Description inputs — grid layout, no labels/filenames

`components/horses/media/media-upload-section.tsx`:
- Remove "Descriptions" label paragraph
- Remove filename `<span>`
- Render description inputs in the same `grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-2` as the FileUpload previews
- Each input is full-width below its corresponding file

### Delete button — white text

`media-gallery-section.tsx` — delete icon button: `text-white` class.
`AlertDialogAction` — already uses `text-destructive-foreground`.

### Lightbox — description visible at bottom

`lightbox-dialog.tsx` — already renders description at the bottom in a gradient overlay. Verify `p-6` padding and `text-white`/`text-base` for readability.

### Lightbox — ensure 90% screen size

`lightbox-dialog.tsx` — already set to `w-[95vw] h-[95vh]`. Verify it works correctly.

---

## 4. Files Summary

| File | Action |
|------|--------|
| `app/api/v1/horses/[id]/documents/[docId]/route.ts` | Modify — read storagePublicId from DB |
| `lib/services/horseDocumentService.ts` | Modify — add `resource_type: "auto"` |
| `models/HorseMedia.ts` | Modify — add `storagePublicId`, `isVisibleOnHub` |
| `lib/services/horseMediaService.ts` | Modify — type + simplify deleteMedia |
| `lib/validations/horseMedia.ts` | Modify — add new fields |
| `app/api/v1/horses/[id]/media/upload/route.ts` | Modify — store new fields at upload |
| `app/api/v1/horses/[id]/media/[mediaId]/route.ts` | Modify — read storagePublicId from DB |
| `app/api/v1/horses/[id]/media/[mediaId]/visibility/route.ts` | **New** — PATCH endpoint |
| `hooks/queries/useHorseMedia.ts` | Modify — add visibility toggle mutation |
| `components/horses/media/media-gallery-section.tsx` | Modify — visibility icon + delete styling |
| `components/horses/media/media-upload-section.tsx` | Modify — description input layout |
| `components/horses/media/lightbox-dialog.tsx` | Modify — description readability |
| `messages/en.json` | Modify — visibilityOn/Off keys |
| `messages/es.json` | Modify — visibilityOn/Off keys |
| `tests/lib/services/horseMediaService.test.ts` | Modify — update deleteMedia tests |

---

## 5. Execution Order

1. Model (`HorseMedia.ts`) — add fields
2. Service types + logic (`horseMediaService.ts`, `horseDocumentService.ts`)
3. Zod validation (`horseMedia.ts`)
4. Routes (document delete, media delete, media upload, visibility PATCH)
5. Hooks (`useHorseMedia.ts`)
6. UI components (gallery, upload section, lightbox)
7. i18n
8. Tests update
9. Verify: lint, typecheck, test suite
