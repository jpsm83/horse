# Plan 3: Events Tab + Calendar Integration

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development.

**Goal:** Add an Events/Calendar tab to the horse entity page with `@fullcalendar/react` integration, a `HorseEvent` model, API endpoints, and dual calendar/table views.

**Architecture:** Mongoose `HorseEvent` model + route handler under `/api/v1/horses/:horseId/events`. Calendar view as primary (forward-looking) + table view (past/filtering). The Events tab is the horse's daily schedule hub.

**Tech Stack:** Next.js 16, @fullcalendar/react, @fullcalendar/daygrid, @fullcalendar/timegrid, Mongoose, TanStack Query v5, shadcn/ui

## Global Constraints

- All events keyed by `horseId` with source entity attribution (Option C)
- Calendar = primary view for upcoming events; table = secondary for filtering/searching past events
- Owner + all related entities can view and add events
- No hard deletes
- i18n strings in `messages/`
- `npm run ui:sync` or `npx shadcn add` for new shadcn components

---

## File Structure

### New files:
- `models/HorseEvent.ts`
- `app/api/v1/horses/[id]/events/route.ts`
- `lib/services/horseEventService.ts`
- `lib/validations/horseEvent.ts`
- `hooks/queries/useHorseEvents.ts`
- `components/horses/horse-events-page-content.tsx`
- `components/horses/horse-events-calendar.tsx`
- `components/horses/horse-events-table.tsx`
- `components/horses/horse-event-form.tsx`
- `app/[locale]/horses/[horseId]/events/page.tsx`

### Files to modify:
- `models/index.ts`
- `lib/navigation/horseTabs.ts`
- `lib/api/queryKeys.ts`
- `messages/en.json`, `messages/es.json`

---

### Task 1: Install @fullcalendar dependencies

- [ ] **Step 1: Install packages**

```bash
npm install @fullcalendar/react @fullcalendar/daygrid @fullcalendar/timegrid @fullcalendar/interaction
```

- [ ] **Step 2: Commit**

```bash
git add package.json package-lock.json
git commit -m "feat: add @fullcalendar dependencies for Events tab"
```

---

### Task 2: Create HorseEvent model

- [ ] **Step 1: Create model**

```ts
import mongoose, { Schema, model } from "mongoose";
import { deactivationAuditFields } from "./sharedSchemas/deactivationAudit.ts";

const horseEventSchema = new Schema(
  {
    horseId: { type: Schema.Types.ObjectId, ref: "Horse", required: true, index: true },
    sourceEntityType: { type: String },
    sourceEntityId: { type: Schema.Types.ObjectId },
    createdByUserId: { type: Schema.Types.ObjectId, ref: "User", required: true },

    eventType: {
      type: String,
      enum: ["appointment", "competition", "training", "feeding", "other"],
      required: true,
    },
    title: { type: String, required: true },
    description: { type: String },
    startDate: { type: Date, required: true, index: true },
    endDate: { type: Date },
    allDay: { type: Boolean, default: false },
    location: { type: String },

    visibilityMode: {
      type: String,
      enum: ["owner", "entities", "public"],
      default: "entities",
    },
    visibilityEntityIds: [{ type: Schema.Types.ObjectId }],

    ...deactivationAuditFields,
  },
  { timestamps: true },
);

horseEventSchema.index({ horseId: 1, startDate: -1 });

const HorseEvent = mongoose.models.HorseEvent || model("HorseEvent", horseEventSchema);
export default HorseEvent;
```

- [ ] **Step 2: Export from models/index.ts**

- [ ] **Step 3: Commit**

---

### Task 3: Create service + validation + API

- [ ] **Step 1: Create validation (`lib/validations/horseEvent.ts`)**

- [ ] **Step 2: Create service (`lib/services/horseEventService.ts`)**

- [ ] **Step 3: Create route handler**

```ts
import connectDb from "@/lib/db.ts";
import { withRoute, ok } from "@/lib/api/response.ts";
import { requireAuthFromRequest } from "@/lib/auth/requireAuth.ts";
import * as eventService from "@/lib/services/horseEventService.ts";

type RouteContext = { params: Promise<{ id: string }> };

export async function GET(request: Request, context: RouteContext) {
  return withRoute(async () => {
    await connectDb();
    const session = await requireAuthFromRequest(request);
    const { id } = await context.params;
    const { searchParams } = new URL(request.url);
    const from = searchParams.get("from") ?? undefined;
    const to = searchParams.get("to") ?? undefined;
    const events = await eventService.listEvents(id, from, to);
    return ok({ events });
  });
}

export async function POST(request: Request, context: RouteContext) {
  return withRoute(async () => {
    await connectDb();
    const session = await requireAuthFromRequest(request);
    const { id } = await context.params;
    const input = await request.json();
    const event = await eventService.createEvent(session.id, id, input);
    return ok({ event }, 201);
  });
}
```

- [ ] **Step 4: Commit**

---

### Task 4: Create TanStack Query hooks

- [ ] **Step 1: Create `hooks/queries/useHorseEvents.ts`**

```ts
"use client";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { fetchWithAuth, parseApiResponse } from "@/lib/api/fetchWithAuth";
import { queryKeys } from "@/lib/api/queryKeys";

export type CalendarEvent = {
  id: string;
  title: string;
  start: string;
  end?: string;
  allDay?: boolean;
  eventType: string;
  location?: string;
};

async function fetchEvents(horseId: string, from?: string, to?: string): Promise<CalendarEvent[]> {
  const params = new URLSearchParams();
  if (from) params.set("from", from);
  if (to) params.set("to", to);
  const qs = params.toString();
  const res = await fetchWithAuth(`/api/v1/horses/${encodeURIComponent(horseId)}/events${qs ? `?${qs}` : ""}`);
  const data = await parseApiResponse<{ events: CalendarEvent[] }>(res);
  return data.events;
}

export function useHorseEvents(horseId: string, from?: string, to?: string) {
  return useQuery({
    queryKey: [...queryKeys.horses.all, horseId, "events", from, to],
    queryFn: () => fetchEvents(horseId, from, to),
    enabled: !!horseId,
  });
}
```

- [ ] **Step 2: Commit**

---

### Task 5: Create Calendar component

- [ ] **Step 1: Create calendar component**

```tsx
"use client";

import { useMemo } from "react";
import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import timeGridPlugin from "@fullcalendar/timegrid";
import interactionPlugin from "@fullcalendar/interaction";
import type { CalendarEvent } from "@/hooks/queries/useHorseEvents";

type Props = {
  events: CalendarEvent[];
  onEventClick?: (eventId: string) => void;
  onDateClick?: (date: string) => void;
};

export function HorseEventsCalendar({ events, onEventClick, onDateClick }: Props) {
  const calendarEvents = useMemo(
    () =>
      events.map((e) => ({
        id: e.id,
        title: e.title,
        start: e.start,
        end: e.end,
        allDay: e.allDay,
        extendedProps: { eventType: e.eventType, location: e.location },
      })),
    [events],
  );

  return (
    <div className="rounded-lg border p-4">
      <FullCalendar
        plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
        initialView="dayGridMonth"
        events={calendarEvents}
        headerToolbar={{
          left: "prev,next today",
          center: "title",
          right: "dayGridMonth,timeGridWeek,timeGridDay",
        }}
        eventClick={(info) => onEventClick?.(info.event.id)}
        dateClick={(info) => onDateClick?.(info.dateStr)}
        height="auto"
        locale="en"
      />
    </div>
  );
}
```

- [ ] **Step 2: Commit**

---

### Task 6: Create Events tab page + route

- [ ] **Step 1: Create route page** (`app/[locale]/horses/[horseId]/events/page.tsx`)

- [ ] **Step 2: Create events page content** with calendar + table toggle

- [ ] **Step 3: Commit**

---

### Task 7: Update horseTabs + i18n

- [ ] **Step 1: Add events tab to horseTabs**

```ts
{ id: "events", label: "Events", href: `/horses/${horseId}/events` },
```
Note: Events tab is NOT owner-only — all related entities can see it.

- [ ] **Step 2: Add i18n keys**

- [ ] **Step 3: Commit**

---

### Task 8: Final verification

- [ ] Run `npm run typecheck` — no errors
- [ ] Run `npm test` — all pass
- [ ] Verify calendar renders with test events
- [ ] Verify table toggle shows filterable event list
