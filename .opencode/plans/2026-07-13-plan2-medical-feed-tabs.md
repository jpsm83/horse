# Plan 2: Medical + Feed Tabs

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development to implement this plan task-by-task.

**Goal:** Add Medical/Health and Feed & Nutrition tabs to the horse entity page, with new models, API endpoints, TanStack Query hooks, and tab UI.

**Architecture:** New Mongoose models (`HorseHealthRecord`, `HorseFeedPlan`) with route handlers under `/api/v1/horses/:horseId/`. Data follows Option C pattern: horse-keyed collections with source entity attribution.

**Tech Stack:** Next.js 16, Mongoose, TanStack Query v5, shadcn/ui, next-intl

## Global Constraints

- All horse data is keyed by `horseId` with `sourceEntityType`/`sourceEntityId` attribution
- Records created by entities (vet, stable) are editable by that entity; visible per section visibility
- No hard deletes — soft deactivation via `deactivationAuditFields`
- Routes are thin: parse input → call service → return `ok`/`fail`
- All client data fetching via TanStack Query hooks in `hooks/queries/`
- i18n via next-intl, all strings in `messages/en.json` and `messages/es.json`
- shadcn components only in `components/ui/`
- Reuse `DataTable` and `SectionVisibilityPopover` from Plan 1

---

## File Structure

### New files to create:
- `models/HorseHealthRecord.ts` — Mongoose model for health records
- `models/HorseFeedPlan.ts` — Mongoose model for feed plans
- `app/api/v1/horses/[id]/health/route.ts` — Health record API routes
- `app/api/v1/horses/[id]/feed/route.ts` — Feed plan API routes
- `lib/services/horseHealthService.ts` — Health record service layer
- `lib/services/horseFeedService.ts` — Feed plan service layer
- `lib/validations/horseHealth.ts` — Zod schemas for health records
- `lib/validations/horseFeed.ts` — Zod schemas for feed plans
- `hooks/queries/useHorseHealth.ts` — TanStack hooks for health records
- `hooks/queries/useHorseFeed.ts` — TanStack hooks for feed plans
- `components/horses/horse-health-page-content.tsx` — Medical tab content
- `components/horses/horse-health-records.tsx` — Health records list/table
- `components/horses/horse-health-record-form.tsx` — Add/edit health record form
- `components/horses/horse-feed-page-content.tsx` — Feed tab content
- `components/horses/horse-feed-plans.tsx` — Feed plans list/table
- `components/horses/horse-feed-plan-form.tsx` — Add/edit feed plan form
- `app/[locale]/horses/[horseId]/health/page.tsx` — Medical route page
- `app/[locale]/horses/[horseId]/feed/page.tsx` — Feed route page

### Files to modify:
- `models/index.ts` — Export new models
- `lib/navigation/horseTabs.ts` — Add health and feed tabs
- `lib/api/queryKeys.ts` — Add health and feed query keys
- `messages/en.json` — Add medical and feed i18n keys
- `messages/es.json` — Same changes as en.json

---

### Task 1: Create HorseHealthRecord model

**Files:**
- Create: `models/HorseHealthRecord.ts`
- Reference: `models/Relationship.ts` (existing model pattern)

- [ ] **Step 1: Create the model**

```ts
/**
 * HorseHealthRecord — medical records attributed to source entities.
 *
 * Each record is keyed by `horseId` with `sourceEntityType`/`sourceEntityId`
 * to attribute it to the creating entity (vet, stable, owner).
 *
 * Option C pattern: horse-keyed collection, entity-attributed.
 */

import mongoose, { Schema, model } from "mongoose";
import { deactivationAuditFields } from "./sharedSchemas/deactivationAudit.ts";
import * as enums from "../utils/enums.ts";

const { accountTypeEnums } = enums;

const horseHealthRecordSchema = new Schema(
  {
    horseId: {
      type: Schema.Types.ObjectId,
      ref: "Horse",
      required: true,
      index: true,
    },
    sourceEntityType: { type: String, enum: accountTypeEnums },
    sourceEntityId: { type: Schema.Types.ObjectId },
    createdByUserId: { type: Schema.Types.ObjectId, ref: "User", required: true },

    recordType: {
      type: String,
      enum: ["vaccination", "exam", "medication", "injury", "allergy", "other"],
      required: true,
    },
    title: { type: String, required: true },
    description: { type: String },
    date: { type: Date, required: true },
    performedBy: { type: String },
    notes: { type: String },

    // Visibility (future: integrated with SectionVisibilityPopover)
    visibilityMode: {
      type: String,
      enum: ["owner", "entities", "public"],
      default: "owner",
    },
    visibilityEntityIds: [{ type: Schema.Types.ObjectId }],

    ...deactivationAuditFields,
  },
  { timestamps: true },
);

horseHealthRecordSchema.index({ horseId: 1, date: -1 });
horseHealthRecordSchema.index({ sourceEntityId: 1, sourceEntityType: 1 });

const HorseHealthRecord =
  mongoose.models.HorseHealthRecord || model("HorseHealthRecord", horseHealthRecordSchema);
export default HorseHealthRecord;
```

- [ ] **Step 2: Export from models/index.ts**

```ts
export { default as HorseHealthRecord } from "./HorseHealthRecord.ts";
```

- [ ] **Step 3: Commit**

```bash
git add models/HorseHealthRecord.ts models/index.ts
git commit -m "feat: add HorseHealthRecord model"
```

---

### Task 2: Create HorseFeedPlan model

**Files:**
- Create: `models/HorseFeedPlan.ts`

- [ ] **Step 1: Create the model**

```ts
/**
 * HorseFeedPlan — feed schedules attributed to source entities.
 *
 * Each plan entry represents a meal or supplement scheduled for the horse.
 * Source attribution allows stables, vets, or owners to manage feed.
 */

import mongoose, { Schema, model } from "mongoose";
import { deactivationAuditFields } from "./sharedSchemas/deactivationAudit.ts";
import * as enums from "../utils/enums.ts";

const { accountTypeEnums } = enums;

const horseFeedPlanSchema = new Schema(
  {
    horseId: {
      type: Schema.Types.ObjectId,
      ref: "Horse",
      required: true,
      index: true,
    },
    sourceEntityType: { type: String, enum: accountTypeEnums },
    sourceEntityId: { type: Schema.Types.ObjectId },
    createdByUserId: { type: Schema.Types.ObjectId, ref: "User", required: true },

    mealTime: {
      type: String,
      enum: ["morning", "afternoon", "evening", "night"],
      required: true,
    },
    feedType: { type: String, required: true },
    quantity: { type: String },
    unit: { type: String, default: "kg" },
    supplements: [{
      name: { type: String },
      quantity: { type: String },
      unit: { type: String },
    }],
    notes: { type: String },
    isActive: { type: Boolean, default: true },
    scheduleDays: [{ type: String, enum: ["mon","tue","wed","thu","fri","sat","sun"] }],

    visibilityMode: {
      type: String,
      enum: ["owner", "entities", "public"],
      default: "owner",
    },
    visibilityEntityIds: [{ type: Schema.Types.ObjectId }],

    ...deactivationAuditFields,
  },
  { timestamps: true },
);

horseFeedPlanSchema.index({ horseId: 1, mealTime: 1 });
horseFeedPlanSchema.index({ sourceEntityId: 1, sourceEntityType: 1 });

const HorseFeedPlan =
  mongoose.models.HorseFeedPlan || model("HorseFeedPlan", horseFeedPlanSchema);
export default HorseFeedPlan;
```

- [ ] **Step 2: Export from models/index.ts**

```ts
export { default as HorseFeedPlan } from "./HorseFeedPlan.ts";
```

- [ ] **Step 3: Commit**

```bash
git add models/HorseFeedPlan.ts models/index.ts
git commit -m "feat: add HorseFeedPlan model"
```

---

### Task 3: Create Zod validation schemas

**Files:**
- Create: `lib/validations/horseHealth.ts`
- Create: `lib/validations/horseFeed.ts`

- [ ] **Step 1: Create health record validation**

```ts
import { z } from "zod";

export const healthRecordTypeEnum = z.enum([
  "vaccination", "exam", "medication", "injury", "allergy", "other",
]);

export const visibilityModeEnum = z.enum(["owner", "entities", "public"]);

export const createHealthRecordSchema = z.object({
  recordType: healthRecordTypeEnum,
  title: z.string().min(1).max(200),
  description: z.string().max(2000).optional(),
  date: z.string().datetime().or(z.string().regex(/^\d{4}-\d{2}-\d{2}$/)),
  performedBy: z.string().max(200).optional(),
  notes: z.string().max(5000).optional(),
  visibilityMode: visibilityModeEnum.optional().default("owner"),
  visibilityEntityIds: z.array(z.string()).optional(),
});

export const updateHealthRecordSchema = createHealthRecordSchema.partial();

export const listHealthRecordsQuerySchema = z.object({
  recordType: healthRecordTypeEnum.optional(),
  from: z.string().optional(),
  to: z.string().optional(),
});
```

- [ ] **Step 2: Create feed plan validation**

```ts
import { z } from "zod";

export const mealTimeEnum = z.enum(["morning", "afternoon", "evening", "night"]);

export const dayEnum = z.enum(["mon","tue","wed","thu","fri","sat","sun"]);

export const supplementSchema = z.object({
  name: z.string().min(1).max(200),
  quantity: z.string().optional(),
  unit: z.string().optional(),
});

export const createFeedPlanSchema = z.object({
  mealTime: mealTimeEnum,
  feedType: z.string().min(1).max(200),
  quantity: z.string().optional(),
  unit: z.string().optional().default("kg"),
  supplements: z.array(supplementSchema).optional(),
  notes: z.string().max(2000).optional(),
  scheduleDays: z.array(dayEnum).optional(),
  visibilityMode: z.enum(["owner", "entities", "public"]).optional().default("owner"),
  visibilityEntityIds: z.array(z.string()).optional(),
});

export const updateFeedPlanSchema = createFeedPlanSchema.partial();

export const listFeedPlansQuerySchema = z.object({
  mealTime: mealTimeEnum.optional(),
  isActive: z.coerce.boolean().optional(),
});
```

- [ ] **Step 3: Commit**

```bash
git add lib/validations/horseHealth.ts lib/validations/horseFeed.ts
git commit -m "feat: add Zod validation schemas for horse health and feed"
```

---

### Task 4: Create service layers

**Files:**
- Create: `lib/services/horseHealthService.ts`
- Create: `lib/services/horseFeedService.ts`

- [ ] **Step 1: Create health record service

```ts
import HorseHealthRecord from "@/models/HorseHealthRecord.ts";

export type PublicHealthRecord = {
  id: string;
  horseId: string;
  recordType: string;
  title: string;
  description?: string;
  date: string;
  performedBy?: string;
  notes?: string;
  sourceEntityType?: string;
  sourceEntityLabel?: string;
  visibilityMode: string;
  createdAt: string;
  updatedAt: string;
};

function toPublic(record: Record<string, unknown>): PublicHealthRecord {
  return {
    id: String(record._id),
    horseId: String(record.horseId),
    recordType: record.recordType as string,
    title: record.title as string,
    description: record.description as string | undefined,
    date: record.date instanceof Date ? record.date.toISOString() : String(record.date),
    performedBy: record.performedBy as string | undefined,
    notes: record.notes as string | undefined,
    sourceEntityType: record.sourceEntityType as string | undefined,
    sourceEntityLabel: record.sourceEntityLabel as string | undefined,
    visibilityMode: record.visibilityMode as string,
    createdAt: (record.createdAt as Date).toISOString(),
    updatedAt: (record.updatedAt as Date).toISOString(),
  };
}

export async function listHealthRecords(horseId: string): Promise<PublicHealthRecord[]> {
  const records = await HorseHealthRecord.find({ horseId, isActive: true })
    .sort({ date: -1 })
    .lean();
  return records.map(toPublic);
}

export async function createHealthRecord(
  userId: string,
  horseId: string,
  input: Record<string, unknown>,
): Promise<PublicHealthRecord> {
  const record = await HorseHealthRecord.create({
    ...input,
    horseId,
    createdByUserId: userId,
    date: new Date(input.date as string),
  });
  return toPublic(record.toObject());
}

export async function updateHealthRecord(
  recordId: string,
  userId: string,
  input: Record<string, unknown>,
): Promise<PublicHealthRecord | null> {
  const update: Record<string, unknown> = { ...input };
  if (input.date) update.date = new Date(input.date as string);
  const record = await HorseHealthRecord.findOneAndUpdate(
    { _id: recordId, createdByUserId: userId, isActive: true },
    { $set: update },
    { new: true, runValidators: true },
  ).lean();
  return record ? toPublic(record) : null;
}

export async function deleteHealthRecord(
  recordId: string,
  userId: string,
): Promise<boolean> {
  const result = await HorseHealthRecord.updateOne(
    { _id: recordId, createdByUserId: userId },
    { $set: { isActive: false, deactivatedAt: new Date() } },
  );
  return result.modifiedCount > 0;
}
```

- [ ] **Step 2: Create feed plan service**

```ts
import HorseFeedPlan from "@/models/HorseFeedPlan.ts";

export type PublicFeedPlan = {
  id: string;
  horseId: string;
  mealTime: string;
  feedType: string;
  quantity?: string;
  unit?: string;
  supplements?: Array<{ name: string; quantity?: string; unit?: string }>;
  notes?: string;
  isActive: boolean;
  scheduleDays?: string[];
  sourceEntityType?: string;
  visibilityMode: string;
  createdAt: string;
  updatedAt: string;
};

function toPublic(record: Record<string, unknown>): PublicFeedPlan {
  return {
    id: String(record._id),
    horseId: String(record.horseId),
    mealTime: record.mealTime as string,
    feedType: record.feedType as string,
    quantity: record.quantity as string | undefined,
    unit: record.unit as string | undefined,
    supplements: record.supplements as Array<{ name: string; quantity?: string; unit?: string }> | undefined,
    notes: record.notes as string | undefined,
    isActive: record.isActive as boolean,
    scheduleDays: record.scheduleDays as string[] | undefined,
    sourceEntityType: record.sourceEntityType as string | undefined,
    visibilityMode: record.visibilityMode as string,
    createdAt: (record.createdAt as Date).toISOString(),
    updatedAt: (record.updatedAt as Date).toISOString(),
  };
}

export async function listFeedPlans(horseId: string): Promise<PublicFeedPlan[]> {
  const plans = await HorseFeedPlan.find({ horseId, isActive: true })
    .sort({ mealTime: 1 })
    .lean();
  return plans.map(toPublic);
}

export async function createFeedPlan(
  userId: string,
  horseId: string,
  input: Record<string, unknown>,
): Promise<PublicFeedPlan> {
  const plan = await HorseFeedPlan.create({
    ...input,
    horseId,
    createdByUserId: userId,
  });
  return toPublic(plan.toObject());
}

export async function updateFeedPlan(
  planId: string,
  userId: string,
  input: Record<string, unknown>,
): Promise<PublicFeedPlan | null> {
  const plan = await HorseFeedPlan.findOneAndUpdate(
    { _id: planId, createdByUserId: userId, isActive: true },
    { $set: input },
    { new: true, runValidators: true },
  ).lean();
  return plan ? toPublic(plan) : null;
}

export async function deleteFeedPlan(planId: string, userId: string): Promise<boolean> {
  const result = await HorseFeedPlan.updateOne(
    { _id: planId, createdByUserId: userId },
    { $set: { isActive: false, deactivatedAt: new Date() } },
  );
  return result.modifiedCount > 0;
}
```

- [ ] **Step 3: Commit**

```bash
git add lib/services/horseHealthService.ts lib/services/horseFeedService.ts
git commit -m "feat: add horse health and feed service layers"
```

---

### Task 5: Create API route handlers

**Files:**
- Create: `app/api/v1/horses/[id]/health/route.ts`
- Create: `app/api/v1/horses/[id]/feed/route.ts`

- [ ] **Step 1: Create health record route handler**

```ts
import connectDb from "@/lib/db.ts";
import { withRoute, ok } from "@/lib/api/response.ts";
import { requireAuthFromRequest } from "@/lib/auth/requireAuth.ts";
import { createHealthRecordSchema, updateHealthRecordSchema, listHealthRecordsQuerySchema } from "@/lib/validations/horseHealth.ts";
import * as healthService from "@/lib/services/horseHealthService.ts";

type RouteContext = { params: Promise<{ id: string }> };

export async function GET(request: Request, context: RouteContext) {
  return withRoute(async () => {
    await connectDb();
    const session = await requireAuthFromRequest(request);
    const { id } = await context.params;
    const records = await healthService.listHealthRecords(id);
    return ok({ records });
  });
}

export async function POST(request: Request, context: RouteContext) {
  return withRoute(async () => {
    await connectDb();
    const session = await requireAuthFromRequest(request);
    const { id } = await context.params;
    const input = createHealthRecordSchema.parse(await request.json());
    const record = await healthService.createHealthRecord(session.id, id, input);
    return ok({ record }, 201);
  });
}
```

- [ ] **Step 2: Create feed plan route handler**

```ts
import connectDb from "@/lib/db.ts";
import { withRoute, ok } from "@/lib/api/response.ts";
import { requireAuthFromRequest } from "@/lib/auth/requireAuth.ts";
import { createFeedPlanSchema, updateFeedPlanSchema } from "@/lib/validations/horseFeed.ts";
import * as feedService from "@/lib/services/horseFeedService.ts";

type RouteContext = { params: Promise<{ id: string }> };

export async function GET(request: Request, context: RouteContext) {
  return withRoute(async () => {
    await connectDb();
    const session = await requireAuthFromRequest(request);
    const { id } = await context.params;
    const plans = await feedService.listFeedPlans(id);
    return ok({ plans });
  });
}

export async function POST(request: Request, context: RouteContext) {
  return withRoute(async () => {
    await connectDb();
    const session = await requireAuthFromRequest(request);
    const { id } = await context.params;
    const input = createFeedPlanSchema.parse(await request.json());
    const plan = await feedService.createFeedPlan(session.id, id, input);
    return ok({ plan }, 201);
  });
}
```

- [ ] **Step 3: Commit**

```bash
git add app/api/v1/horses/[id]/health/route.ts app/api/v1/horses/[id]/feed/route.ts
git commit -m "feat: add health and feed API route handlers"
```

---

### Task 6: Add query keys and TanStack Query hooks

**Files:**
- Modify: `lib/api/queryKeys.ts`
- Create: `hooks/queries/useHorseHealth.ts`
- Create: `hooks/queries/useHorseFeed.ts`

- [ ] **Step 1: Add query keys**

Add to `lib/api/queryKeys.ts` under `horses`:
```ts
health: (horseId: string) => [...queryKeys.horses.all, horseId, "health"] as const,
feed: (horseId: string) => [...queryKeys.horses.all, horseId, "feed"] as const,
```

- [ ] **Step 2: Create health hooks**

```ts
"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { fetchWithAuth, parseApiResponse } from "@/lib/api/fetchWithAuth";
import { queryKeys } from "@/lib/api/queryKeys";
import type { PublicHealthRecord } from "@/lib/services/horseHealthService";

async function fetchHealthRecords(horseId: string): Promise<PublicHealthRecord[]> {
  const res = await fetchWithAuth(`/api/v1/horses/${encodeURIComponent(horseId)}/health`);
  const data = await parseApiResponse<{ records: PublicHealthRecord[] }>(res);
  return data.records;
}

async function createHealthRecordApi(horseId: string, input: Record<string, unknown>) {
  const res = await fetchWithAuth(`/api/v1/horses/${encodeURIComponent(horseId)}/health`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });
  return parseApiResponse<{ record: PublicHealthRecord }>(res);
}

export function useHorseHealthRecords(horseId: string) {
  return useQuery({
    queryKey: queryKeys.horses.health(horseId),
    queryFn: () => fetchHealthRecords(horseId),
    enabled: !!horseId,
  });
}

export function useCreateHealthRecord(horseId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: Record<string, unknown>) => createHealthRecordApi(horseId, input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.horses.health(horseId) });
    },
  });
}
```

- [ ] **Step 3: Create feed hooks**

```ts
"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { fetchWithAuth, parseApiResponse } from "@/lib/api/fetchWithAuth";
import { queryKeys } from "@/lib/api/queryKeys";
import type { PublicFeedPlan } from "@/lib/services/horseFeedService";

async function fetchFeedPlans(horseId: string): Promise<PublicFeedPlan[]> {
  const res = await fetchWithAuth(`/api/v1/horses/${encodeURIComponent(horseId)}/feed`);
  const data = await parseApiResponse<{ plans: PublicFeedPlan[] }>(res);
  return data.plans;
}

async function createFeedPlanApi(horseId: string, input: Record<string, unknown>) {
  const res = await fetchWithAuth(`/api/v1/horses/${encodeURIComponent(horseId)}/feed`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });
  return parseApiResponse<{ plan: PublicFeedPlan }>(res);
}

export function useHorseFeedPlans(horseId: string) {
  return useQuery({
    queryKey: queryKeys.horses.feed(horseId),
    queryFn: () => fetchFeedPlans(horseId),
    enabled: !!horseId,
  });
}

export function useCreateFeedPlan(horseId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: Record<string, unknown>) => createFeedPlanApi(horseId, input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.horses.feed(horseId) });
    },
  });
}
```

- [ ] **Step 4: Commit**

```bash
git add lib/api/queryKeys.ts hooks/queries/useHorseHealth.ts hooks/queries/useHorseFeed.ts
git commit -m "feat: add TanStack Query hooks for health and feed"
```

---

### Task 7: Create Medical tab page + route

**Files:**
- Create: `app/[locale]/horses/[horseId]/health/page.tsx`
- Create: `components/horses/horse-health-page-content.tsx`
- Create: `components/horses/horse-health-records.tsx`
- Create: `components/horses/horse-health-record-form.tsx`

- [ ] **Step 1: Create route page**

```tsx
import { Suspense } from "react";
import type { Metadata } from "next";
import { generatePrivateMetadata } from "@/lib/seo/metadata-factory.ts";
import { HorseHealthPageContent } from "@/components/horses/horse-health-page-content.tsx";

type PageProps = { params: Promise<{ horseId: string; locale: string }> };

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { locale } = await params;
  return generatePrivateMetadata(locale, "/horses/[horseId]/health", "metadata.horseHealth");
}

export default async function HorseHealthPage({ params }: PageProps) {
  const { horseId } = await params;
  return (
    <Suspense fallback={<div className="max-w-3xl mx-auto p-6">Loading...</div>}>
      <HorseHealthPageContent horseId={horseId} />
    </Suspense>
  );
}
```

- [ ] **Step 2: Create health page content**

```tsx
"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { HorsePageShell } from "@/components/horses/horse-page-shell.tsx";
import { DataTable, type ColumnDef } from "@/components/ui/data-table.tsx";
import { SectionVisibilityPopover } from "@/components/ui/section-visibility-popover.tsx";
import { Button } from "@/components/ui/button";
import { useHorseHealthRecords, useCreateHealthRecord } from "@/hooks/queries/useHorseHealth.ts";
import { useAppToast } from "@/hooks/use-app-toast.ts";
import type { PublicHealthRecord } from "@/lib/services/horseHealthService";

type Props = { horseId: string };

export function HorseHealthPageContent({ horseId }: Props) {
  const t = useTranslations("horseMedical");
  const toast = useAppToast();
  const { data: records = [] } = useHorseHealthRecords(horseId);
  const [showForm, setShowForm] = useState(false);

  const columns: ColumnDef<PublicHealthRecord>[] = [
    {
      id: "date",
      header: t("date"),
      accessorFn: (r) => new Date(r.date).toLocaleDateString(),
      sortable: true,
    },
    {
      id: "type",
      header: t("type"),
      accessorFn: (r) => t(`types.${r.recordType}`),
      sortable: true,
      filterable: true,
    },
    {
      id: "title",
      header: t("title"),
      accessorFn: (r) => r.title,
      sortable: true,
      filterable: true,
    },
    {
      id: "performedBy",
      header: t("performedBy"),
      accessorFn: (r) => r.performedBy ?? "-",
    },
  ];

  return (
    <HorsePageShell horseId={horseId} title={t("title")} requireOwnership>
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold">{t("records")}</h2>
          <p className="text-sm text-muted-foreground">{t("description")}</p>
        </div>
        <SectionVisibilityPopover
          sectionKey="medical"
          current={{ mode: "owner" }}
          onChange={() => {}}
        />
      </div>

      <div className="flex justify-end">
        <Button onClick={() => setShowForm(!showForm)}>
          {showForm ? t("cancel") : t("addRecord")}
        </Button>
      </div>

      {showForm && (
        <HorseHealthRecordForm
          horseId={horseId}
          onSaved={() => setShowForm(false)}
        />
      )}

      <DataTable
        columns={columns}
        data={records}
        filterPlaceholder={t("filterPlaceholder")}
        emptyMessage={t("noRecords")}
      />
    </HorsePageShell>
  );
}
```

[Note: `HorseHealthRecordForm` would be an inline form component in `horse-health-record-form.tsx` with date picker, record type selector, title, and notes fields.]

- [ ] **Step 3: Commit**

```bash
git add app/[locale]/horses/[horseId]/health/page.tsx components/horses/horse-health-page-content.tsx components/horses/horse-health-records.tsx components/horses/horse-health-record-form.tsx
git commit -m "feat: add Medical tab with health records"
```

---

### Task 8: Create Feed tab page + route

**Files:**
- Create: `app/[locale]/horses/[horseId]/feed/page.tsx`
- Create: `components/horses/horse-feed-page-content.tsx`
- Create: `components/horses/horse-feed-plans.tsx`
- Create: `components/horses/horse-feed-plan-form.tsx`

Follow same pattern as Task 7 (route page + content component + form + table).

- [ ] **Step 1: Commit**

```bash
git add app/[locale]/horses/[horseId]/feed/page.tsx components/horses/horse-feed-page-content.tsx components/horses/horse-feed-plans.tsx components/horses/horse-feed-plan-form.tsx
git commit -m "feat: add Feed tab with feed plans"
```

---

### Task 9: Update horseTabs and i18n

**Files:**
- Modify: `lib/navigation/horseTabs.ts`
- Modify: `messages/en.json`
- Modify: `messages/es.json`

- [ ] **Step 1: Update horseTabs — add health and feed**

```ts
{ id: "health", label: "Medical", href: `/horses/${horseId}/health`, requireOwnership: true },
{ id: "feed", label: "Feed", href: `/horses/${horseId}/feed`, requireOwnership: true },
```

Insert after Connect tab, before Edit.

- [ ] **Step 2: Add i18n keys for Medical tab**

```json
"horseMedical": {
  "title": "Medical & Health",
  "description": "Medical records, vaccinations, exams, and medications.",
  "records": "Health records",
  "addRecord": "Add record",
  "cancel": "Cancel",
  "date": "Date",
  "type": "Type",
  "title": "Title",
  "performedBy": "Performed by",
  "filterPlaceholder": "Filter records...",
  "noRecords": "No health records yet.",
  "types": {
    "vaccination": "Vaccination",
    "exam": "Exam",
    "medication": "Medication",
    "injury": "Injury",
    "allergy": "Allergy",
    "other": "Other"
  }
}
```

- [ ] **Step 3: Add i18n keys for Feed tab**

```json
"horseFeed": {
  "title": "Feed & Nutrition",
  "description": "Daily feed schedule, supplements, and diet plans.",
  "plans": "Feed plans",
  "addPlan": "Add meal",
  "cancel": "Cancel",
  "mealTime": "Meal time",
  "feedType": "Feed type",
  "quantity": "Quantity",
  "supplements": "Supplements",
  "notes": "Notes",
  "filterPlaceholder": "Filter plans...",
  "noPlans": "No feed plans yet.",
  "mealTimes": {
    "morning": "Morning",
    "afternoon": "Afternoon",
    "evening": "Evening",
    "night": "Night"
  }
}
```

- [ ] **Step 4: Commit**

```bash
git add lib/navigation/horseTabs.ts messages/en.json messages/es.json
git commit -m "feat: add Medical and Feed tabs to navigation + i18n"
```

---

### Task 10: Final verification

- [ ] **Step 1: Run typecheck**

Run: `npm run typecheck`
Expected: No errors

- [ ] **Step 2: Run tests**

Run: `npm test`
Expected: All tests pass

- [ ] **Step 3: Final commit**

```bash
git commit -m "chore: cleanup after medical and feed tabs"
```
