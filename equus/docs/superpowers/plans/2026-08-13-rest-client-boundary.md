# REST Client Boundary Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make the Next.js web UI a REST client of `/api/v1` the same way React Native will be — no page, layout, or component calls `lib/services` or `models` at runtime.

**Architecture:** Keep one Next.js process. Route handlers under `app/api/v1/` remain the backend (thin HTTP → `lib/services` → `models`). The web UI (`app/[locale]/`, `components/`, `hooks/`) talks only to that REST API via TanStack Query + `fetchWithAuth`. Drop RSC layout prefetch that currently calls services and `connectDb()`. Type-only imports from services stay allowed. Do not extract Nest/Fastify.

**Tech Stack:** Next.js 16 App Router, Vitest, TanStack Query, existing `/api/v1` routes, `lib/api/response.ts` `{ data }` envelope.

## Global Constraints

- Work from `equus/`. Run tests with `npm test`.
- Do not add NestJS, Fastify, Server Actions, or a second deployable.
- Do not migrate the existing `tests/` mirror into `__tests__/` in this plan (already documented in `docs/conventions/testing.md`; move files only when a later task touches that module).
- Do not prefetch via internal `fetch('/api/v1/...')` from layouts in this plan. Layouts render chrome only; client hooks load data.
- Runtime imports of `@/lib/services/*` and `@/models/*` are allowed only under `app/api/`. `import type` is allowed in UI.
- `PreferHydrationBoundary` exists only to protect RSC-seeded cache. After layouts stop seeding, remove the wrapper and then the unused component.
- Commit only when the user asks; commit steps below are optional checkpoints.
- Dated `docs/superpowers/` artifacts are history — do not rewrite them.

## Out of scope

- Moving 151 existing test files into `__tests__/`.
- Splitting the API into a separate server.
- Moving DTO types out of `lib/services` (type-only UI imports are enough).
- Re-seeding TanStack cache from RSC via HTTP.

## File map

| File | Role |
|------|------|
| `docs/conventions/architecture.md` | Layer contract: UI vs API vs domain |
| `docs/engineering/stack.md` | Diagram + drop Server Actions as API |
| `docs/conventions/nextjs-conventions.md` | UI must not import services/models at runtime |
| `docs/conventions/data-fetching.md` | Client = REST + TanStack only |
| `AGENTS.md` | Always-on: web is an API consumer |
| `docs/engineering/auth.md` | Owns session-seed / expired-access note (historical, for if SSR seed returns) |
| `docs/engineering/page-flow-blueprint.md` | Layout = chrome; data from hooks |
| `docs/engineering/horseTabs.md` | Hub reads `useHorseView` REST, not layout seed |
| `docs/engineering/userTabs.md` | Same for user |
| `tests/architecture/ui-rest-boundary.test.ts` | Scan gate; allowlist shrinks to empty |
| 12 entity `layout.tsx` files | Chrome only |
| `hooks/queries/use*.ts` | Comments: REST is the load path |
| `lib/seo/fetchApiJson.ts` | Cookie-forwarding REST helper for `generateMetadata` |
| `app/[locale]/horses/[horseId]/page.tsx` | Stop `Horse` model |
| `app/[locale]/users/[userId]/page.tsx` | Stop `User` model |
| `components/shared/prefer-hydration-boundary.tsx` | Delete when unused |
| `components/user/user-page-shell.tsx` | Drop seed comment |

---

### Task 1: Lock the docs contract

**Files:**
- Modify: `equus/docs/conventions/architecture.md`
- Modify: `equus/docs/engineering/stack.md`
- Modify: `equus/docs/conventions/nextjs-conventions.md`
- Modify: `equus/docs/conventions/data-fetching.md`
- Modify: `equus/AGENTS.md`

**Interfaces:**
- Consumes: decisions in this plan
- Produces: written rules AIs and humans must follow before any layout change

- [ ] **Step 1: Replace the architecture conventions file**

Replace `equus/docs/conventions/architecture.md` with the following (inner tree uses indented lines, not nested fences):

~~~~markdown
# Architecture — Equus

Multi-client architecture rules and project structure.

## Project structure (Next.js layered)

    app/api/v1/    → REST backend (thin HTTP adapters)
    app/[locale]/  → web UI pages and layouts (API consumers)
    components/    → UI (shadcn/ui + Tailwind)
    hooks/         → TanStack Query hooks (web REST client)
    lib/           → business logic: services, auth, validations, API helpers
    models/        → Mongoose schemas and models

Tests are not a top-level app layer. Module tests live in a `__tests__/` folder next to the code they cover; shared harness/fixtures stay under `tests/`. See [testing.md](testing.md).

- **Route handlers are thin** — parse input, call `lib/` services, return `ok` / `fail` from `lib/api/response.ts`.
- **Business logic stays in `lib/`** — never in React components, pages, or layouts.
- **No custom architecture framework** — standard Next.js App Router layout with clear folder responsibilities.

## Multi-client architecture

The API lives in this Next.js app (`app/api/v1/`) so we do not run a second server for MVP. It is still a **separate backend**: the web UI must not call it “the Next.js way” (RSC → `lib/services` / `models`). Web and React Native both use REST.

- **Backend first** — domain logic lives in `lib/` (services, validations, auth). Only `app/api/v1/**/route.ts` may import services or models at runtime.
- **REST API is the contract** — new features that serve users must expose stable JSON endpoints under `app/api/v1/`. Design payloads and auth so a React Native app can call them without browser-only assumptions.
- **UI is an API consumer** — `app/[locale]/` pages, layouts, `components/`, and `hooks/` load and mutate data through `/api/v1` (TanStack Query + `fetchWithAuth` on the client). Do not call `lib/services` or `models` from UI code. `import type` from services is allowed.
- **Client-agnostic responses** — use `lib/api/response.ts` (`ok`, `fail`, `withRoute`). Return JSON with predictable `{ data }` / `{ error }` shapes; avoid coupling API behavior to Next.js pages or server-rendered UI state.
- **Auth for non-browser clients** — mobile and API clients use **JWT** from `/api/v1/auth/*` (`Authorization: Bearer`). The web app uses **httpOnly cookies** set by the same routes. NextAuth is **Google OAuth transport only**; web session truth is REST cookies via `ensureRestSession()` — see [equus/docs/engineering/auth.md](../engineering/auth.md). Do not rely on NextAuth `useSession()` alone for `isAuthenticated`.
- **No Server Actions as the product API** — they are not usable from React Native. Do not add them as a parallel write path.
- **Versioning** — keep breaking API changes behind new version prefixes (e.g. `v2`); existing mobile builds must keep working against `v1`.
~~~~

When writing `architecture.md`, wrap the folder list in a normal fenced tree (the plan uses indentation only to avoid nested fences).

- [ ] **Step 2: Update stack.md core rules and the “not using” table**

In `equus/docs/engineering/stack.md` §2.1, after the diagram add this sentence:

```markdown
The Next.js web UI is a client of `app/api/v1/*`, same as React Native. Pages and layouts must not call `lib/services` or `models` at runtime.
```

Replace §2.2 item 2:

```markdown
2. **No Server Actions as the product API.** They are not accessible from React Native. Web writes go through `/api/v1` like mobile will.
```

In §11, keep the existing **Server Actions as main API** row. Change **Fastify / separate HTTP server** notes only if they imply pages may call services — they should keep saying REST lives in Route Handlers.

- [ ] **Step 3: Update Next.js conventions imports**

In `equus/docs/conventions/nextjs-conventions.md`, replace the Imports bullet:

```markdown
- **Imports** — use the `@/` path alias (e.g. `@/hooks/queries/useHorse.ts`). UI files under `app/[locale]/`, `components/`, and `hooks/` must not runtime-import `@/lib/services/*` or `@/models/*`. `import type` from services is allowed. Only `app/api/**/route.ts` may import services and models at runtime.
```

- [ ] **Step 4: Update data-fetching.md**

Add this bullet at the top of the list in `equus/docs/conventions/data-fetching.md`:

```markdown
* **REST only from the UI** — layouts and pages do not prefetch via `lib/services` or `connectDb()`. Client sections use TanStack hooks that call `/api/v1`. `loading.tsx` covers first paint.
```

- [ ] **Step 5: Update AGENTS.md**

In `equus/AGENTS.md`, after the paragraph that starts with **Equus** is a **Next.js 16**, add:

```markdown
The web UI is an API consumer of `/api/v1`, the same contract a React Native app will use. Do not call `lib/services` or `models` from pages, layouts, or components (type-only imports are fine). Only route handlers talk to services.
```

- [ ] **Step 6: Sanity-check the docs**

Open the five files and confirm: no remaining instruction that layouts should call `getHorseView` / `connectDb`, and no “Server Actions are optional” product-API wording in `architecture.md` or `stack.md` §2.2.

---

### Task 2: Move the RSC session-seed note; rewrite page-flow

**Files:**
- Modify: `equus/docs/engineering/auth.md`
- Modify: `equus/docs/engineering/page-flow-blueprint.md`
- Modify: `equus/docs/engineering/horseTabs.md`
- Modify: `equus/docs/engineering/userTabs.md`

**Interfaces:**
- Consumes: Task 1 contract
- Produces: engineering docs that match chrome-only layouts

- [ ] **Step 1: Append the session-seed note to auth.md**

Add this section before `## Related docs` in `equus/docs/engineering/auth.md`:

```markdown
## Expired access token vs richer owner cache

`getServerUserId()` (see [`lib/auth/serverSession.ts`](../../lib/auth/serverSession.ts)) tries the access cookie, then a valid refresh cookie. RSC cannot rotate cookies; the client refresh path can.

This mattered when layouts seeded TanStack cache from the server: an expired access token could look like a guest and overwrite an owner-scoped cache. The web UI no longer seeds entity views from RSC. Client `fetchWithAuth` retries once on `401` via `POST /api/v1/auth/refresh`. Do not reintroduce RSC service prefetch. If SSR seed via REST is added later, skip seeding when identity is unresolved but a refresh cookie exists, and never hydrate a guest view over an owner cache.
```

- [ ] **Step 2: Rewrite page-flow layout + data-fetching sections**

In `equus/docs/engineering/page-flow-blueprint.md`:

Replace the directory-structure `layout.tsx` comment:

```text
  layout.tsx            ← RSC chrome only (EntityTabs). No connectDb, no lib/services.
```

Replace the paragraph that currently starts with **`layout.tsx`** pre-fetches once per navigation with:

```markdown
**`layout.tsx`** renders entity chrome (`HorseLayoutChrome` / equivalent). It does not connect to MongoDB and does not call `lib/services`. Child tabs load the role-aware view with TanStack Query (`useHorseView` → `GET /api/v1/horses/:id`). `loading.tsx` shows the body skeleton on first navigation.
```

Replace the entire **§2. Layout RSC** code sample with:

```tsx
// No "use client"
import type { ReactNode } from "react";
import { HorseLayoutChrome } from "@/components/horses/horse-layout-chrome.tsx";

type HorseLayoutProps = {
  children: ReactNode;
  params: Promise<{ horseId: string; locale: string }>;
};

export default async function HorseLayout({ children, params }: HorseLayoutProps) {
  const { horseId } = await params;
  return <HorseLayoutChrome horseId={horseId}>{children}</HorseLayoutChrome>;
}
```

Delete bullets in that section about `getServerUserId`, `canRecoverSession`, and `PreferHydrationBoundary`.

In **§8. Data Fetching Rules**, replace item 1 with:

```markdown
1. **No layout-level service prefetch** — `layout.tsx` is chrome only. `useHorseView` (and entity equivalents) call `GET /api/v1/...`. `placeholderData` keeps tab switches from flashing.
```

In **§11 checklist**, replace:

```
[ ] Confirm layout.tsx exists at app/[locale]/horses/[horseId]/layout.tsx — it pre-fetches horse data for all sub-pages
```

with:

```
[ ] Confirm layout.tsx exists at app/[locale]/horses/[horseId]/layout.tsx — chrome only; no services/models/connectDb
```

Replace the mermaid / flow line that says `getServerUserId()` → `getHorseView` (around the “Layout-level prefetch” architecture diagram in §7–8 if still present) so it reads: layout chrome → client `useHorseView` → `GET /api/v1/horses/:id`.

- [ ] **Step 3: Update horseTabs.md and userTabs.md**

In `equus/docs/engineering/horseTabs.md`, Hub **Data split** first bullet — replace “layout-seeded” with “`useHorseView` → `GET /api/v1/horses/:id`”.

Replace `HubContent (reads useHorseView — cache hit from layout.tsx)` with `HubContent (reads useHorseView → REST)`.

In `equus/docs/engineering/userTabs.md` layout tree, replace:

```
  layout.tsx    ← RSC prefetch getUserView → PreferHydrationBoundary → UserLayoutChrome
```

with:

```
  layout.tsx    ← UserLayoutChrome only (no service prefetch)
```

Replace “Owner — reads `user.sections` from the layout-seeded cache (`getUserView`)” with “Owner — reads `useUserView` → `GET /api/v1/users/me`”.

---

### Task 3: Architecture scan test (allowlist)

**Files:**
- Create: `equus/tests/architecture/ui-rest-boundary.test.ts`

**Interfaces:**
- Consumes: the import rule from Task 1
- Produces: `FORBIDDEN_UI_RUNTIME_IMPORT_ALLOWLIST` that later tasks shrink to `[]`

- [ ] **Step 1: Write the failing-without-allowlist scanner, with allowlist so CI stays green**

Create `equus/tests/architecture/ui-rest-boundary.test.ts`:

```ts
/**
 * UI REST boundary — pages/layouts/components/hooks must not runtime-import
 * services or models. Only app/api route handlers may.
 */
import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

const ROOT = path.resolve(__dirname, "../..");

const SCAN_DIRS = ["app", "components", "hooks"];

/** Shrink this list to [] as layouts and metadata pages are converted. */
export const FORBIDDEN_UI_RUNTIME_IMPORT_ALLOWLIST = [
  "app/[locale]/horses/[horseId]/layout.tsx",
  "app/[locale]/user/[userId]/layout.tsx",
  "app/[locale]/stables/[stableId]/layout.tsx",
  "app/[locale]/breeders/[breederId]/layout.tsx",
  "app/[locale]/transport/[transportId]/layout.tsx",
  "app/[locale]/riding-clubs/[clubId]/layout.tsx",
  "app/[locale]/trainers/[trainerId]/layout.tsx",
  "app/[locale]/groomers/[groomId]/layout.tsx",
  "app/[locale]/veterinaries/[veterinaryId]/layout.tsx",
  "app/[locale]/farriers/[farrierId]/layout.tsx",
  "app/[locale]/coaches/[coachId]/layout.tsx",
  "app/[locale]/riders/[riderId]/layout.tsx",
  "app/[locale]/horses/[horseId]/page.tsx",
  "app/[locale]/users/[userId]/page.tsx",
] as const;

function walk(dir: string, acc: string[] = []): string[] {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      if (entry.name === "api" && path.relative(ROOT, dir).replaceAll("\\", "/") === "app") {
        continue;
      }
      walk(full, acc);
    } else if (/\.(ts|tsx)$/.test(entry.name)) {
      acc.push(full);
    }
  }
  return acc;
}

function toPosix(file: string): string {
  return path.relative(ROOT, file).replaceAll("\\", "/");
}

function runtimeImportTargets(source: string): string[] {
  const importRe =
    /(?:^|\n)import\s+(type\s+)?([\s\S]*?)\s+from\s+["']([^"']+)["']/g;
  const hits: string[] = [];
  let match: RegExpExecArray | null;
  while ((match = importRe.exec(source))) {
    const isTypeOnly = Boolean(match[1]) || /^type\s/.test(match[2].trim());
    if (isTypeOnly) continue;
    const spec = match[3];
    if (spec.startsWith("@/lib/services/") || spec.startsWith("@/models/")) {
      hits.push(spec);
    }
  }
  return hits;
}

describe("UI REST boundary", () => {
  it("forbids runtime service/model imports outside app/api, except the shrinking allowlist", () => {
    const files = SCAN_DIRS.flatMap((d) => walk(path.join(ROOT, d)));
    const violations: string[] = [];
    const allow = new Set<string>(FORBIDDEN_UI_RUNTIME_IMPORT_ALLOWLIST);

    for (const file of files) {
      const rel = toPosix(file);
      const hits = runtimeImportTargets(fs.readFileSync(file, "utf8"));
      if (hits.length === 0) continue;
      if (allow.has(rel)) continue;
      violations.push(`${rel} → ${hits.join(", ")}`);
    }

    expect(violations, violations.join("\n")).toEqual([]);
  });

  it("allowlist entries still exist and still violate (remove when fixed)", () => {
    for (const rel of FORBIDDEN_UI_RUNTIME_IMPORT_ALLOWLIST) {
      const full = path.join(ROOT, rel);
      expect(fs.existsSync(full), rel).toBe(true);
      const hits = runtimeImportTargets(fs.readFileSync(full, "utf8"));
      expect(hits, `${rel} is on the allowlist but is already clean — remove it`).not.toEqual([]);
    }
  });
});
```

- [ ] **Step 2: Run the new test**

Run from `equus/`:

```bash
npm test -- tests/architecture/ui-rest-boundary.test.ts
```

Expected: PASS (allowlist covers current violators).

---

### Task 4: Horse layout template (chrome only)

**Files:**
- Modify: `equus/app/[locale]/horses/[horseId]/layout.tsx`
- Modify: `equus/hooks/queries/useHorse.ts` (file header comment if you add one; no runtime change)
- Modify: `equus/tests/architecture/ui-rest-boundary.test.ts` (remove horse layout from allowlist)

**Interfaces:**
- Consumes: `HorseLayoutChrome` props `{ horseId: string; children: ReactNode }`
- Produces: chrome-only horse layout pattern copied by Task 5

- [ ] **Step 1: Replace horse layout**

Replace `equus/app/[locale]/horses/[horseId]/layout.tsx` with:

```tsx
/**
 * Horse layout — entity chrome only. Role-aware view loads on the client via
 * useHorseView → GET /api/v1/horses/:id.
 */
import type { ReactNode } from "react";

import { HorseLayoutChrome } from "@/components/horses/horse-layout-chrome.tsx";

type HorseLayoutProps = {
  children: ReactNode;
  params: Promise<{ horseId: string; locale: string }>;
};

export default async function HorseLayout({ children, params }: HorseLayoutProps) {
  const { horseId } = await params;
  return <HorseLayoutChrome horseId={horseId}>{children}</HorseLayoutChrome>;
}
```

- [ ] **Step 2: Drop horse layout from the allowlist**

Remove `"app/[locale]/horses/[horseId]/layout.tsx"` from `FORBIDDEN_UI_RUNTIME_IMPORT_ALLOWLIST`.

- [ ] **Step 3: Run tests**

```bash
npm test -- tests/architecture/ui-rest-boundary.test.ts tests/lib/services/horseService.test.ts
```

Expected: architecture test PASS; horse service tests still PASS (API unchanged).

---

### Task 5: Remaining entity layouts

**Files:**
- Modify each layout listed below to chrome-only
- Modify matching hook file headers (seeded-by-layout comments → REST)
- Modify: `equus/tests/architecture/ui-rest-boundary.test.ts` (remove those 11 layout paths)
- Modify: `equus/hooks/queries/useCurrentUser.ts` (remove HydrationBoundary comment)
- Modify: `equus/components/user/user-page-shell.tsx` (remove seed comment)

**Interfaces:**
- Consumes: Task 4 pattern
- Produces: no entity layout runtime-imports services

For every file, keep the existing chrome component and param name. Do not leave `QueryClient`, `dehydrate`, `PreferHydrationBoundary`, `getServerUserId`, `hasRefreshCookie`, `connectDb`, or service getters.

- [ ] **Step 1: User layout**

Replace `equus/app/[locale]/user/[userId]/layout.tsx` with:

```tsx
/**
 * User layout — entity chrome only. View loads via useUserView → GET /api/v1/users/me.
 */
import type { ReactNode } from "react";

import { UserLayoutChrome } from "@/components/user/user-layout-chrome.tsx";

type UserLayoutProps = {
  children: ReactNode;
  params: Promise<{ userId: string; locale: string }>;
};

export default async function UserLayout({ children, params }: UserLayoutProps) {
  const { userId } = await params;
  return <UserLayoutChrome userId={userId}>{children}</UserLayoutChrome>;
}
```

In `equus/hooks/queries/useCurrentUser.ts` replace the `useUserView` comment with:

```ts
/** Owner user view — GET /api/v1/users/me. */
```

In `equus/components/user/user-page-shell.tsx` replace the comment about PreferHydrationBoundary with:

```ts
  // useUserView → REST; loading.tsx / shell skeleton cover first paint.
```

- [ ] **Step 2: Stable layout**

Replace `equus/app/[locale]/stables/[stableId]/layout.tsx` with:

```tsx
/**
 * Stable layout — entity chrome only. View loads via useStableView → GET /api/v1/stables/:id.
 */
import type { ReactNode } from "react";

import { StableLayoutChrome } from "@/components/stable/stable-layout-chrome.tsx";

type StableLayoutProps = {
  children: ReactNode;
  params: Promise<{ stableId: string; locale: string }>;
};

export default async function StableLayout({ children, params }: StableLayoutProps) {
  const { stableId } = await params;
  return <StableLayoutChrome stableId={stableId}>{children}</StableLayoutChrome>;
}
```

In `equus/hooks/queries/useStable.ts` replace the first paragraph of the file header so it says `useStableView` calls `GET /api/v1/stables/:id` (no layout RSC seed).

- [ ] **Step 3: Breeder layout**

Replace `equus/app/[locale]/breeders/[breederId]/layout.tsx` with:

```tsx
/**
 * Breeder layout — entity chrome only. View loads via useBreederView → GET /api/v1/breeders/:id.
 */
import type { ReactNode } from "react";

import { BreederLayoutChrome } from "@/components/breeder/breeder-layout-chrome.tsx";

type BreederLayoutProps = {
  children: ReactNode;
  params: Promise<{ breederId: string; locale: string }>;
};

export default async function BreederLayout({ children, params }: BreederLayoutProps) {
  const { breederId } = await params;
  return <BreederLayoutChrome breederId={breederId}>{children}</BreederLayoutChrome>;
}
```

Update `equus/hooks/queries/useBreeder.ts` header the same way (REST, not layout seed).

- [ ] **Step 4: Transport layout**

Replace `equus/app/[locale]/transport/[transportId]/layout.tsx` with:

```tsx
/**
 * Transport layout — entity chrome only. View loads via useTransportView → GET /api/v1/transports/:id.
 */
import type { ReactNode } from "react";

import { TransportLayoutChrome } from "@/components/transport/transport-layout-chrome.tsx";

type TransportLayoutProps = {
  children: ReactNode;
  params: Promise<{ transportId: string; locale: string }>;
};

export default async function TransportLayout({ children, params }: TransportLayoutProps) {
  const { transportId } = await params;
  return <TransportLayoutChrome transportId={transportId}>{children}</TransportLayoutChrome>;
}
```

Update `equus/hooks/queries/useTransport.ts` header.

- [ ] **Step 5: Riding club layout**

Replace `equus/app/[locale]/riding-clubs/[clubId]/layout.tsx` with:

```tsx
/**
 * Riding club layout — entity chrome only. View loads via useRidingClubView → GET /api/v1/riding-clubs/:id.
 */
import type { ReactNode } from "react";

import { RidingClubLayoutChrome } from "@/components/riding-club/riding-club-layout-chrome.tsx";

type RidingClubLayoutProps = {
  children: ReactNode;
  params: Promise<{ clubId: string; locale: string }>;
};

export default async function RidingClubLayout({ children, params }: RidingClubLayoutProps) {
  const { clubId } = await params;
  return <RidingClubLayoutChrome clubId={clubId}>{children}</RidingClubLayoutChrome>;
}
```

Update `equus/hooks/queries/useRidingClub.ts` header.

- [ ] **Step 6: Trainer layout**

Replace `equus/app/[locale]/trainers/[trainerId]/layout.tsx` with:

```tsx
/**
 * Trainer layout — entity chrome only. View loads via useTrainerView → GET /api/v1/trainers/:id.
 */
import type { ReactNode } from "react";

import { TrainerLayoutChrome } from "@/components/trainer/trainer-layout-chrome.tsx";

type TrainerLayoutProps = {
  children: ReactNode;
  params: Promise<{ trainerId: string; locale: string }>;
};

export default async function TrainerLayout({ children, params }: TrainerLayoutProps) {
  const { trainerId } = await params;
  return <TrainerLayoutChrome trainerId={trainerId}>{children}</TrainerLayoutChrome>;
}
```

Update `equus/hooks/queries/useTrainer.ts` header.

- [ ] **Step 7: Groom layout**

Replace `equus/app/[locale]/groomers/[groomId]/layout.tsx` with:

```tsx
/**
 * Groom layout — entity chrome only. View loads via useGroomView → GET /api/v1/grooms/:id.
 */
import type { ReactNode } from "react";

import { GroomLayoutChrome } from "@/components/groom/groom-layout-chrome.tsx";

type GroomLayoutProps = {
  children: ReactNode;
  params: Promise<{ groomId: string; locale: string }>;
};

export default async function GroomLayout({ children, params }: GroomLayoutProps) {
  const { groomId } = await params;
  return <GroomLayoutChrome groomId={groomId}>{children}</GroomLayoutChrome>;
}
```

Update `equus/hooks/queries/useGroom.ts` header.

- [ ] **Step 8: Veterinary layout**

Replace `equus/app/[locale]/veterinaries/[veterinaryId]/layout.tsx` with:

```tsx
/**
 * Veterinary layout — entity chrome only. View loads via useVeterinaryView → GET /api/v1/veterinaries/:id.
 */
import type { ReactNode } from "react";

import { VeterinaryLayoutChrome } from "@/components/veterinary/veterinary-layout-chrome.tsx";

type VeterinaryLayoutProps = {
  children: ReactNode;
  params: Promise<{ veterinaryId: string; locale: string }>;
};

export default async function VeterinaryLayout({ children, params }: VeterinaryLayoutProps) {
  const { veterinaryId } = await params;
  return (
    <VeterinaryLayoutChrome veterinaryId={veterinaryId}>{children}</VeterinaryLayoutChrome>
  );
}
```

Update `equus/hooks/queries/useVeterinary.ts` header.

- [ ] **Step 9: Farrier layout**

Replace `equus/app/[locale]/farriers/[farrierId]/layout.tsx` with:

```tsx
/**
 * Farrier layout — entity chrome only. View loads via useFarrierView → GET /api/v1/farriers/:id.
 */
import type { ReactNode } from "react";

import { FarrierLayoutChrome } from "@/components/farrier/farrier-layout-chrome.tsx";

type FarrierLayoutProps = {
  children: ReactNode;
  params: Promise<{ farrierId: string; locale: string }>;
};

export default async function FarrierLayout({ children, params }: FarrierLayoutProps) {
  const { farrierId } = await params;
  return <FarrierLayoutChrome farrierId={farrierId}>{children}</FarrierLayoutChrome>;
}
```

Update `equus/hooks/queries/useFarrier.ts` header.

- [ ] **Step 10: Coach layout**

Replace `equus/app/[locale]/coaches/[coachId]/layout.tsx` with:

```tsx
/**
 * Coach layout — entity chrome only. View loads via useCoachView → GET /api/v1/coaches/:id.
 */
import type { ReactNode } from "react";

import { CoachLayoutChrome } from "@/components/coach/coach-layout-chrome.tsx";

type CoachLayoutProps = {
  children: ReactNode;
  params: Promise<{ coachId: string; locale: string }>;
};

export default async function CoachLayout({ children, params }: CoachLayoutProps) {
  const { coachId } = await params;
  return <CoachLayoutChrome coachId={coachId}>{children}</CoachLayoutChrome>;
}
```

Update `equus/hooks/queries/useCoach.ts` header.

- [ ] **Step 11: Rider layout**

Replace `equus/app/[locale]/riders/[riderId]/layout.tsx` with:

```tsx
/**
 * Rider layout — entity chrome only. View loads via useRiderView → GET /api/v1/riders/:id.
 */
import type { ReactNode } from "react";

import { RiderLayoutChrome } from "@/components/rider/rider-layout-chrome.tsx";

type RiderLayoutProps = {
  children: ReactNode;
  params: Promise<{ riderId: string; locale: string }>;
};

export default async function RiderLayout({ children, params }: RiderLayoutProps) {
  const { riderId } = await params;
  return <RiderLayoutChrome riderId={riderId}>{children}</RiderLayoutChrome>;
}
```

Update `equus/hooks/queries/useRider.ts` header.

- [ ] **Step 12: Shrink allowlist and re-run**

Leave only these two allowlist entries:

```ts
export const FORBIDDEN_UI_RUNTIME_IMPORT_ALLOWLIST = [
  "app/[locale]/horses/[horseId]/page.tsx",
  "app/[locale]/users/[userId]/page.tsx",
] as const;
```

Run:

```bash
npm test -- tests/architecture/ui-rest-boundary.test.ts
```

Expected: PASS.

---

### Task 6: `generateMetadata` via REST (horse + public user)

**Files:**
- Create: `equus/lib/seo/fetchApiJson.ts`
- Create: `equus/lib/seo/__tests__/fetchApiJson.test.ts`
- Modify: `equus/app/[locale]/horses/[horseId]/page.tsx`
- Modify: `equus/app/[locale]/users/[userId]/page.tsx`
- Modify: `equus/tests/architecture/ui-rest-boundary.test.ts` (allowlist `[]`)

**Interfaces:**
- Consumes: `AUTH_CONFIG.APP_URL`, `ok()` envelope `{ data: T }`, `GET /api/v1/horses/:id` → `HorseViewResponse`, `GET /api/v1/users/:id` → `{ user: PublicUserProfileCard }`
- Produces: `fetchApiJson<T>(path: string): Promise<T | null>`

- [ ] **Step 1: Write fetchApiJson tests**

Create `equus/lib/seo/__tests__/fetchApiJson.test.ts`:

```ts
import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("next/headers", () => ({
  cookies: vi.fn(async () => ({
    toString: () => "access_token=test-access",
  })),
}));

vi.mock("@/lib/auth/config.ts", () => ({
  AUTH_CONFIG: { APP_URL: "http://localhost:3000" },
}));

describe("fetchApiJson", () => {
  beforeEach(() => {
    vi.unstubAllGlobals();
  });

  it("returns data from the REST envelope and forwards cookies", async () => {
    const fetchMock = vi.fn(async () => ({
      ok: true,
      json: async () => ({ data: { horse: { name: "Ada" } } }),
    }));
    vi.stubGlobal("fetch", fetchMock);
    const { fetchApiJson } = await import("@/lib/seo/fetchApiJson.ts");
    await expect(fetchApiJson("/api/v1/horses/abc")).resolves.toEqual({
      horse: { name: "Ada" },
    });
    expect(fetchMock).toHaveBeenCalledWith(
      "http://localhost:3000/api/v1/horses/abc",
      expect.objectContaining({
        cache: "no-store",
        headers: { cookie: "access_token=test-access" },
      }),
    );
  });

  it("returns null when the API is not ok", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => ({ ok: false, json: async () => ({}) })),
    );
    const { fetchApiJson } = await import("@/lib/seo/fetchApiJson.ts");
    await expect(fetchApiJson("/api/v1/horses/missing")).resolves.toBeNull();
  });
});
```

- [ ] **Step 2: Run tests — expect FAIL (module missing)**

```bash
npm test -- lib/seo/__tests__/fetchApiJson.test.ts
```

Expected: FAIL resolving `@/lib/seo/fetchApiJson.ts`.

- [ ] **Step 3: Implement fetchApiJson**

Create `equus/lib/seo/fetchApiJson.ts`:

```ts
/**
 * Cookie-forwarding GET for generateMetadata. Uses the public REST API so
 * pages never import models or services.
 */
import { cookies } from "next/headers";

import { AUTH_CONFIG } from "@/lib/auth/config.ts";

export async function fetchApiJson<T>(path: string): Promise<T | null> {
  const cookieHeader = (await cookies()).toString();
  const url = new URL(path, AUTH_CONFIG.APP_URL).toString();
  const response = await fetch(url, {
    headers: cookieHeader ? { cookie: cookieHeader } : {},
    cache: "no-store",
  });
  if (!response.ok) return null;
  const body = (await response.json()) as { data?: T };
  return body.data ?? null;
}
```

- [ ] **Step 4: Re-run fetchApiJson tests**

```bash
npm test -- lib/seo/__tests__/fetchApiJson.test.ts
```

Expected: PASS.

- [ ] **Step 5: Horse hub metadata via REST**

Replace `equus/app/[locale]/horses/[horseId]/page.tsx` with:

```tsx
import type { Metadata } from "next";

import { HubContent } from "./client.tsx";
import { generateHorseMetadata } from "@/lib/seo/entity-metadata.ts";
import { fetchApiJson } from "@/lib/seo/fetchApiJson.ts";
import type { HorseViewResponse } from "@/lib/services/horseService.ts";

type HorseHubPageProps = {
  params: Promise<{ horseId: string; locale: string }>;
};

export async function generateMetadata({ params }: HorseHubPageProps): Promise<Metadata> {
  const { horseId, locale } = await params;
  const view = await fetchApiJson<HorseViewResponse>(
    `/api/v1/horses/${encodeURIComponent(horseId)}`,
  );
  const horse = view?.horse;
  if (!horse?.name) {
    return { title: "Horse Not Found | Equus", robots: "noindex, nofollow" };
  }
  return generateHorseMetadata(
    {
      name: horse.name,
      breed: horse.breed,
      age: horse.dateOfBirth
        ? new Date().getFullYear() - new Date(horse.dateOfBirth).getFullYear()
        : undefined,
      description: horse.description,
      image: horse.profileImageUrl,
    },
    locale,
    horseId,
  );
}

export default async function HorseHubPage({ params }: HorseHubPageProps) {
  const { horseId } = await params;
  return <HubContent horseId={horseId} />;
}
```

(`import type { HorseViewResponse }` is allowed.)

- [ ] **Step 6: Public user metadata via REST**

Replace the metadata + imports in `equus/app/[locale]/users/[userId]/page.tsx` so it no longer imports `User` from models. Keep `userIdParamSchema` and `notFound()` in the page component.

```tsx
import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { UserHubPublicPage } from "./client";
import { userIdParamSchema } from "@/lib/validations/user.ts";
import { generateUserMetadata } from "@/lib/seo/entity-metadata.ts";
import { fetchApiJson } from "@/lib/seo/fetchApiJson.ts";
import type { PublicUserProfileCard } from "@/lib/privacy/userPublicProfile.ts";

type UserProfilePageProps = {
  params: Promise<{ userId: string; locale: string }>;
};

export async function generateMetadata({ params }: UserProfilePageProps): Promise<Metadata> {
  const { userId, locale } = await params;
  const payload = await fetchApiJson<{ user: PublicUserProfileCard }>(
    `/api/v1/users/${encodeURIComponent(userId)}`,
  );
  const user = payload?.user;
  if (!user) {
    return { title: "User Not Found | Equus", robots: "noindex, nofollow" };
  }
  const displayName =
    [user.firstName, user.lastName].filter(Boolean).join(" ") || user.username || "User";
  return generateUserMetadata(
    { displayName, bio: user.bio, image: user.imageUrl },
    locale,
    userId,
  );
}

export default async function Page({ params }: UserProfilePageProps) {
  const { userId } = await params;
  const parsedUserId = userIdParamSchema.safeParse(userId);

  if (!parsedUserId.success) {
    notFound();
  }

  return <UserHubPublicPage userId={parsedUserId.data} />;
}
```

Note: public metadata now follows GET `/api/v1/users/:id` visibility (correct). It must not use raw `User.findById`.

- [ ] **Step 7: Empty the allowlist**

Set:

```ts
export const FORBIDDEN_UI_RUNTIME_IMPORT_ALLOWLIST = [] as const;
```

Change the second test so an empty allowlist is valid — replace it with:

```ts
  it("allowlist is empty when all UI bypasses are gone", () => {
    expect(FORBIDDEN_UI_RUNTIME_IMPORT_ALLOWLIST).toEqual([]);
  });
```

Run:

```bash
npm test -- tests/architecture/ui-rest-boundary.test.ts lib/seo/__tests__/fetchApiJson.test.ts
```

Expected: PASS.

---

### Task 7: Remove dead PreferHydrationBoundary

**Files:**
- Delete: `equus/components/shared/prefer-hydration-boundary.tsx`
- Grep the repo under `equus/` (except `docs/superpowers/`) for `PreferHydrationBoundary`

**Interfaces:**
- Consumes: Tasks 4–5 removed all wrappers
- Produces: no unused hydration helper

- [ ] **Step 1: Confirm no remaining imports**

From `equus/`:

```bash
rg "PreferHydrationBoundary" --glob "!docs/superpowers/**"
```

Expected hits: only this plan, `docs/engineering/auth.md` (historical note), and the component file itself. `page-flow-blueprint.md` and `userTabs.md` / `horseTabs.md` must already be updated in Task 2.

- [ ] **Step 2: Delete the component**

Delete `equus/components/shared/prefer-hydration-boundary.tsx`.

- [ ] **Step 3: Re-grep and run tests**

```bash
rg "prefer-hydration-boundary" --glob "!docs/superpowers/**"
npm test -- tests/architecture/ui-rest-boundary.test.ts
```

Expected: no source imports; architecture test PASS.

---

### Task 8: Verification

**Files:** none new

- [ ] **Step 1: Boundary grep**

From `equus/`, UI must not runtime-import services/models. The architecture test is the source of truth:

```bash
npm test -- tests/architecture/ui-rest-boundary.test.ts
```

Expected: PASS with empty allowlist.

- [ ] **Step 2: Broader regression**

```bash
npm test
```

Expected: all existing Vitest suites pass. Layout changes do not alter `lib/services` behavior.

- [ ] **Step 3: Manual UI checks (real flows)**

1. Open a horse hub as guest — Hub loads via REST; skeleton then content; 404 for Layer-1 deny still works.
2. Open the same horse as owner with a valid session — tabs match `allowedTabs`; Profile/Admin available.
3. Expire or wait out access cookie, keep refresh cookie, navigate horse tabs — client refresh succeeds; you do not see a stuck guest hub.
4. Owner user hub `/user/:id` — chrome + sections load without layout prefetch.
5. Public `/users/:id` — page title/description respect visibility (no private name leak from Mongo).
6. One other entity (stable) hub + profile tab switch — `placeholderData` still avoids a full-page skeleton flash.

- [ ] **Step 4: Docs spot-check**

`architecture.md`, `stack.md` §2.2, `page-flow-blueprint.md` §2 and §8, `AGENTS.md` all say UI → REST. No living convention tells agents to call `getHorseView` from `layout.tsx`.

---

## Spec coverage (self-review)

| Requirement | Task |
|-------------|------|
| Docs: UI is REST client; API stays in Next.js | 1 |
| Move expired-access / seed note out of architecture.md | 2 (`auth.md`) |
| Page-flow / tabs match chrome-only layouts | 2 |
| Enforcement test | 3 |
| Horse layout template | 4 |
| Other 11 layouts | 5 |
| generateMetadata without models | 6 |
| Dead PreferHydrationBoundary | 7 |
| Tests + real flows | 8 |
| No Nest split / no test-folder migration | Global constraints |
