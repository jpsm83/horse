# Plan 5: History + Audit Log Tab

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development.

**Goal:** Add a History tab with a complete audit log of all actions taken on the horse. Every create, update, delete, relationship change, and ownership change is recorded and displayed in a filterable table.

**Architecture:** Mongoose `HorseAuditLog` model. A centralized audit service that intercepts all horse-related mutations (via service layer calls, not middleware). Read-only API endpoint for the frontend.

**Tech Stack:** Next.js 16, Mongoose, TanStack Query v5, shadcn/ui

---

## File Structure

### New files:
- `models/HorseAuditLog.ts`
- `lib/services/horseAuditService.ts` — centralized audit recording
- `app/api/v1/horses/[id]/audit/route.ts` — read-only audit endpoint
- `hooks/queries/useHorseAudit.ts`
- `components/horses/horse-history-page-content.tsx` — replaces placeholder
- `app/[locale]/horses/[horseId]/history/page.tsx` — update existing

### Files to modify:
- `models/index.ts`
- `lib/navigation/horseTabs.ts` (no change needed — History tab already exists)
- `lib/api/queryKeys.ts`
- `messages/en.json`, `messages/es.json` — update from placeholder to real content

---

### Task 1: Create HorseAuditLog model

```ts
import mongoose, { Schema, model } from "mongoose";

const horseAuditLogSchema = new Schema(
  {
    horseId: { type: Schema.Types.ObjectId, ref: "Horse", required: true, index: true },
    actorId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    actorLabel: { type: String },

    actionType: {
      type: String,
      enum: [
        "horse.created", "horse.updated",
        "relationship.created", "relationship.ended",
        "ownership.transferred", "ownership.co_owner_added",
        "ownership.co_owner_removed", "ownership.co_owner_promoted",
        "health.created", "health.updated", "health.deleted",
        "feed.created", "feed.updated", "feed.deleted",
        "event.created", "event.updated", "event.deleted",
        "media.created", "media.deleted",
        "document.created", "document.updated", "document.deleted",
      ],
      required: true,
    },
    description: { type: String, required: true },
    metadata: { type: Schema.Types.Mixed },
  },
  { timestamps: true },
);

horseAuditLogSchema.index({ horseId: 1, createdAt: -1 });
horseAuditLogSchema.index({ actorId: 1 });

const HorseAuditLog = mongoose.models.HorseAuditLog || model("HorseAuditLog", horseAuditLogSchema);
export default HorseAuditLog;
```

---

### Task 2: Create audit service

```ts
import HorseAuditLog from "@/models/HorseAuditLog.ts";

type AuditInput = {
  horseId: string;
  actorId: string;
  actorLabel?: string;
  actionType: string;
  description: string;
  metadata?: Record<string, unknown>;
};

export async function recordAudit(input: AuditInput): Promise<void> {
  await HorseAuditLog.create(input);
}

export async function listAuditLogs(
  horseId: string,
  filters?: { actionType?: string; from?: string; to?: string },
) {
  const query: Record<string, unknown> = { horseId };
  if (filters?.actionType) query.actionType = filters.actionType;
  if (filters?.from || filters?.to) {
    query.createdAt = {};
    if (filters?.from) (query.createdAt as Record<string, unknown>).$gte = new Date(filters.from);
    if (filters?.to) (query.createdAt as Record<string, unknown>).$lte = new Date(filters.to);
  }

  const logs = await HorseAuditLog.find(query)
    .sort({ createdAt: -1 })
    .limit(500)
    .lean();

  return logs.map((log) => ({
    id: String(log._id),
    horseId: String(log.horseId),
    actorLabel: log.actorLabel ?? String(log.actorId),
    actionType: log.actionType,
    description: log.description,
    createdAt: (log.createdAt as Date).toISOString(),
  }));
}
```

---

### Task 3: Create API route + hooks

- Read-only `GET /api/v1/horses/:horseId/audit` with optional query filters
- `useHorseAuditLogs(horseId, filters)` TanStack hook

---

### Task 4: Update History tab UI

Replace placeholder content with:

```tsx
"use client";

import { useTranslations } from "next-intl";
import { HorsePageShell } from "@/components/horses/horse-page-shell.tsx";
import { DataTable, type ColumnDef } from "@/components/ui/data-table.tsx";
import { useHorseAuditLogs } from "@/hooks/queries/useHorseAudit.ts";

type Props = { horseId: string };

export function HorseHistoryPageContent({ horseId }: Props) {
  const t = useTranslations("horseHistory");
  const { data: logs = [] } = useHorseAuditLogs(horseId);

  const columns: ColumnDef<typeof logs[0]>[] = [
    { id: "date", header: t("date"), accessorFn: (r) => new Date(r.createdAt).toLocaleString(), sortable: true },
    { id: "action", header: t("action"), accessorFn: (r) => t(`actions.${r.actionType}`), sortable: true, filterable: true },
    { id: "description", header: t("description"), accessorFn: (r) => r.description, filterable: true },
    { id: "actor", header: t("actor"), accessorFn: (r) => r.actorLabel, sortable: true, filterable: true },
  ];

  return (
    <HorsePageShell horseId={horseId} title={t("title")}>
      <DataTable
        columns={columns}
        data={logs}
        filterPlaceholder={t("filterPlaceholder")}
        emptyMessage={t("empty")}
      />
    </HorsePageShell>
  );
}
```

---

### Task 5: Integrate audit calls into existing services

Add `recordAudit()` calls to key service mutations:
- `horseService.ts` — horse created/updated
- `relationshipService.ts` — relationship created/ended
- `ownershipTransferService.ts` — transfer created/completed
- `horseHealthService.ts` — health record created/updated/deleted (from Plan 2)
- `horseFeedService.ts` — feed plan created/updated/deleted (from Plan 2)
- `horseEventService.ts` — event created/updated/deleted (from Plan 3)
- `horseMediaService.ts` — media created/deleted (from Plan 4)
- `horseDocumentService.ts` — document created/updated/deleted (from Plan 4)

Each call is fire-and-forget (no await needed in the mutation path):

```ts
import { recordAudit } from "@/lib/services/horseAuditService.ts";

// In create/update/delete service methods:
recordAudit({
  horseId,
  actorId: userId,
  actionType: "health.created",
  description: `Health record "${title}" added`,
}).catch(() => {}); // fire and forget
```

---

### Task 6: Update i18n keys

Replace placeholder `horseHistory` with:

```json
"horseHistory": {
  "title": "History",
  "date": "Date",
  "action": "Action",
  "description": "Description",
  "actor": "Actor",
  "filterPlaceholder": "Search history...",
  "empty": "No activity recorded yet.",
  "actions": {
    "horse.created": "Horse created",
    "horse.updated": "Horse updated",
    "relationship.created": "Connection established",
    "relationship.ended": "Connection ended",
    "ownership.transferred": "Ownership transferred",
    "ownership.co_owner_added": "Co-owner added",
    "ownership.co_owner_removed": "Co-owner removed",
    "ownership.co_owner_promoted": "Co-owner promoted",
    "health.created": "Health record added",
    "health.updated": "Health record updated",
    "feed.created": "Feed plan added",
    "event.created": "Event scheduled",
    "event.updated": "Event updated",
    "media.created": "Media added",
    "document.created": "Document added"
  }
}
```

---

### Task 7: Final verification

- [ ] `npm run typecheck` — no errors
- [ ] `npm test` — all pass
- [ ] Creating a health record appears in history log
- [ ] Connecting a provider appears in history log
- [ ] Loading history tab shows all recorded actions in table
- [ ] Filter by action type works
