# Plan 4: Media + Documents Tabs

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development.

**Goal:** Add Media/Gallery and Documents tabs. Media expands the existing horse gallery with per-item visibility. Documents uses the existing `Document` model with new horse-specific API endpoints.

**Architecture:** New `HorseMedia` collection (separate from embedded gallery for scalability). Existing `Document` model gets new API endpoints under horses. Both follow Option C (horse-keyed, entity-attributed).

**Tech Stack:** Next.js 16, Mongoose, TanStack Query v5, shadcn/ui, Cloudinary (existing upload)

---

## File Structure

### New files:
- `models/HorseMedia.ts`
- `app/api/v1/horses/[id]/media/route.ts`
- `app/api/v1/horses/[id]/documents/route.ts`
- `lib/services/horseMediaService.ts`
- `lib/services/horseDocumentService.ts`
- `lib/validations/horseMedia.ts`
- `lib/validations/horseDocument.ts`
- `hooks/queries/useHorseMedia.ts`
- `hooks/queries/useHorseDocuments.ts`
- `components/horses/horse-media-page-content.tsx`
- `components/horses/horse-media-gallery.tsx`
- `components/horses/horse-media-upload.tsx`
- `components/horses/horse-documents-page-content.tsx`
- `components/horses/horse-documents-list.tsx`
- `components/horses/horse-document-upload.tsx`
- `app/[locale]/horses/[horseId]/media/page.tsx`
- `app/[locale]/horses/[horseId]/documents/page.tsx`

### Files to modify:
- `models/index.ts`
- `lib/navigation/horseTabs.ts`
- `lib/api/queryKeys.ts`
- `messages/en.json`, `messages/es.json`

---

### Task 1: Create HorseMedia model

```ts
import mongoose, { Schema, model } from "mongoose";
import { deactivationAuditFields } from "./sharedSchemas/deactivationAudit.ts";
import * as enums from "../utils/enums.ts";

const { accountTypeEnums } = enums;

const horseMediaSchema = new Schema(
  {
    horseId: { type: Schema.Types.ObjectId, ref: "Horse", required: true, index: true },
    sourceEntityType: { type: String, enum: accountTypeEnums },
    sourceEntityId: { type: Schema.Types.ObjectId },
    uploadedByUserId: { type: Schema.Types.ObjectId, ref: "User", required: true },

    type: { type: String, enum: ["image", "video", "other"], required: true },
    url: { type: String, required: true },
    thumbnailUrl: { type: String },
    title: { type: String },
    description: { type: String },
    fileSizeBytes: { type: Number },
    mimeType: { type: String },

    // Owner can override visibility of non-owner media
    visibilityMode: {
      type: String,
      enum: ["owner", "entities", "public"],
      default: "owner",
    },
    visibilityOverriddenByOwner: { type: Boolean, default: false },
    visibilityEntityIds: [{ type: Schema.Types.ObjectId }],

    ...deactivationAuditFields,
  },
  { timestamps: true },
);

horseMediaSchema.index({ horseId: 1, createdAt: -1 });
horseMediaSchema.index({ sourceEntityId: 1, sourceEntityType: 1 });

const HorseMedia = mongoose.models.HorseMedia || model("HorseMedia", horseMediaSchema);
export default HorseMedia;
```

---

### Task 2: Create service + API for HorseMedia

Follow the same CRUD pattern as Plans 1-2 (`horseMediaService.ts` + route handler + validation).

The Media API:
- `GET /api/v1/horses/:horseId/media` — list media for horse
- `POST /api/v1/horses/:horseId/media` — upload new media (uses existing Cloudinary `/api/v1/media/upload`)
- `PATCH /api/v1/horses/:horseId/media/:id` — update visibility
- `DELETE /api/v1/horses/:horseId/media/:id` — soft delete

---

### Task 3: Create horse-specific Document API

The `Document` model already exists. Create new API endpoints under horses:

- `GET /api/v1/horses/:horseId/documents` — list documents for horse
- `POST /api/v1/horses/:horseId/documents` — upload new document (uses Cloudinary)
- `PATCH /api/v1/horses/:horseId/documents/:id` — update visibility/metadata
- `DELETE /api/v1/horses/:horseId/documents/:id` — soft delete

Service layer: `lib/services/horseDocumentService.ts` wraps the existing `Document` model with horse-specific queries.

---

### Task 4: Create Media tab UI

- `HorseMediaPageContent` — tab wrapper with gallery grid + upload button
- `HorseMediaGallery` — responsive grid of media items with per-item visibility badges
- `HorseMediaUpload` — upload form (file picker + title + visibility controls)

---

### Task 5: Create Documents tab UI

- `HorseDocumentsPageContent` — tab wrapper with table + upload button
- `HorseDocumentsList` — DataTable with columns: type, title, date, visibility, actions
- `HorseDocumentUpload` — upload form with document type selector + file picker

---

### Task 6: Update horseTabs + i18n

Add tabs:
```ts
{ id: "media", label: "Media", href: `/horses/${horseId}/media` },
{ id: "documents", label: "Documents", href: `/horses/${horseId}/documents` },
```

Both tabs are public-visible (content gated by per-item visibility).

---

### Task 7: Final verification

- [ ] `npm run typecheck` — no errors
- [ ] `npm test` — all pass
- [ ] Media gallery renders with uploaded images
- [ ] Documents list renders with uploaded documents
- [ ] Visibility controls work on per-item basis
