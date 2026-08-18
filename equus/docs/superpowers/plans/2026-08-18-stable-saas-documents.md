# Stable SaaS — Documents sub-plan

> **Parent:** [`2026-08-18-stable-saas-ops.md`](2026-08-18-stable-saas-ops.md)

**Goal:** Stable uploads documents per hosted horse; files stored in Cloudinary; metadata for horse display aggregation.

**Feature IDs:** S-HORSE-12–13, S-FD-09

**Prerequisite:** Roster sub-plan done.

---

### Task 1: StableDocument model + service

**Files:**
- Create: `equus/models/StableDocument.ts`
- Create: `equus/lib/services/stableDocumentService.ts`
- Test: `equus/lib/services/__tests__/stableDocumentService.test.ts`

```ts
// stableId, horseId, title, folder?, cloudinaryPublicId, url, mimeType, uploadedByUserId
```

- [ ] Create/list/delete; horse must be on active roster
- [ ] Commit

### Task 2: REST + upload flow

**Files:**
- Create: `equus/app/api/v1/stables/[id]/horses/[horseId]/documents/route.ts`
- Reuse Cloudinary patterns from horse media routes

- [ ] POST multipart or signed upload URL pattern matching existing media conventions
- [ ] Commit

### Task 3: Documents tab UI

**Files:**
- Create: `equus/app/[locale]/stables/[stableId]/documents/page.tsx`
- Create: `equus/components/stables/documents/`

- [ ] Filter by horse; upload + list
- [ ] Commit

### Task 4: Horse display hook (minimal)

- [ ] Ensure documents created with `sourceEntityType/Id` fields where horse GET will aggregate (plan #6) — add fields on StableDocument now

### Task 5: Docs + umbrella status

- [ ] Update engineering docs; mark sub-plan 2 **done**
