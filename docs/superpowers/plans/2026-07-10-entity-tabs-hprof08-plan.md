# Entity Tab Navigation & H-PROF-08 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans.

**Goal:** Add reusable entity tab navigation and fully implement horse profile editing (H-PROF-08).

**Architecture:** EntityTabs component (shadcn Tabs) + tab sub-routes under /horses/[horseId]/ + PATCH API for editing.

**Tech Stack:** Next.js 16, shadcn/ui, Mongoose, TypeScript

---

### Task 1: Create EntityTabs component

**Files:**
- Create: components/ui/entity-tabs.tsx

Create reusable tab bar component using shadcn Tabs primitives.

`	ypescript
export interface EntityTab {
  id: string;
  label: string;
  href: string;
  requireOwnership?: boolean;
}

interface EntityTabsProps {
  tabs: EntityTab[];
  basePath: string;
  isOwner: boolean;
}
`

The component filters tabs by ownership, reads pathname to determine active tab, and renders shadcn Tabs with Link-wrapped triggers.

- [ ] Step 1: Create file and commit

---

### Task 2: Add validation schema for horse profile updates

**Files:**
- Modify: lib/validations/horse.ts

Add updateHorseProfileSchema — all fields from createHorseSchema as optional, excluding discovery fields.

- [ ] Step 1: Add schema and commit

---

### Task 3: Add updateHorseProfile service function

**Files:**
- Modify: lib/services/horseService.ts

Add async function that:
1. Checks horse exists
2. Checks actor is owner or co-owner
3. Strips undefined, applies 
4. Returns updated horse

- [ ] Step 1: Add function and commit

---

### Task 4: Add PATCH route handler

**Files:**
- Modify: app/api/v1/horses/[id]/route.ts

Add PATCH handler using requireAuthFromRequest + updateHorseProfileSchema + service.

- [ ] Step 1: Add PATCH handler and commit

---

### Task 5: Integrate EntityTabs into horse hub page

**Files:**
- Modify: app/[locale]/horses/[horseId]/page.tsx

Add EntityTabs before the horse hub content. Define the 5 tabs: Hub, Edit, Discovery, History, Relations.

- [ ] Step 1: Update page and commit

---

### Task 6: Create edit page (full implementation)

**Files:**
- Create: app/[locale]/horses/[horseId]/edit/page.tsx
- Create: components/horses/horse-edit-page-content.tsx

Server page with generateMetadata. Client component with form pre-populated from horse data, Save button calls PATCH API.

- [ ] Step 1: Create edit page files and commit

---

### Task 7: Create scaffold pages (discovery, history, relations)

**Files:**
- Create: 3 page.tsx files under horses/[horseId]/{discovery,history,relations}/
- Create: 3 placeholder content components in components/horses/

Each scaffold has:
- Server component with generateMetadata and Suspense
- Client placeholder with "Coming soon" message
- Proper routing structure

- [ ] Step 1: Create all 6 files and commit

---

### Task 8: Add translation keys

**Files:**
- Modify: messages/en.json
- Modify: messages/es.json

Add tab labels + edit page translations to horse namespace.

- [ ] Step 1: Update translations and commit

---

### Task 9: Update documentation

**Files:**
- Modify: documentation/horseModule.md

Mark H-PROF-08 as done. Add section on entity tab navigation pattern.

- [ ] Step 1: Update doc and commit

---

### Task 10: Build verification

- [ ] Step 1: npm run build — verify all routes compile

