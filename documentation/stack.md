# Equus — Technical Stack

Canonical technical direction for the horse ecosystem app. All other documentation defers here for engineering decisions.

Related docs:
- `README.md` — documentation index
- `businessPlan.md` — product vision and domain rules
- `mvpScope.md` — what to build first
- `productFlows.md` — user journeys
- `equus/AGENTS.md` — coding conventions for the app repo

---

## 1. Stack at a glance

| Layer | Choice | Notes |
|-------|--------|-------|
| Web | Next.js (App Router) + TypeScript | Dashboards, portals, SEO pages |
| Mobile | React Native (Expo) + TypeScript | iOS and Android from one codebase |
| API | REST via Next.js Route Handlers | `app/api/v1/*` — shared by web and mobile |
| Auth (web) | Auth.js v5 | Cookie/session flow for Next.js |
| Auth (mobile) | JWT access + refresh tokens | REST endpoints; tokens in SecureStore |
| Validation | Zod | All API input and shared form schemas |
| UI (web) | shadcn/ui + Tailwind CSS | **All** web UI components from shadcn |
| Database | MongoDB Atlas + Mongoose | Models in `equus/models/` |
| Media | Cloudinary | All file uploads (photos, videos, documents) |
| Push | Firebase Cloud Messaging | When notifications ship |
| Language | TypeScript everywhere | Web, API, mobile, shared schemas |

**Not in scope:** NestJS, Fastify (separate server), Redis, Python, separate backend service, custom auth from scratch, Clerk/Better Auth (for now).

---

## 2. Architecture

### 2.1 One backend, two clients

Web and mobile share the same domain API and business logic. There is no separate backend application.

```text
┌─────────────────────┐     ┌─────────────────────┐
│  Next.js (web UI)   │     │  React Native       │
│  shadcn + Tailwind  │     │  (Expo)             │
└──────────┬──────────┘     └──────────┬──────────┘
           │                             │
           │  fetch / same-origin        │  HTTPS + JSON
           │                             │  Authorization: Bearer
           └──────────────┬──────────────┘
                          ▼
           ┌──────────────────────────────┐
           │  app/api/v1/*                │  REST Route Handlers
           └──────────────┬───────────────┘
                          ▼
           ┌──────────────────────────────┐
           │  lib/validations/*  (Zod)    │  Parse + sanitize input
           └──────────────┬───────────────┘
                          ▼
           ┌──────────────────────────────┐
           │  lib/services/*              │  Business logic
           └──────────────┬───────────────┘
                          ▼
           ┌──────────────────────────────┐
           │  models/ + MongoDB           │
           └──────────────────────────────┘
```

### 2.2 Core rules

1. **REST API is the contract.** Anything mobile needs must exist as a versioned HTTP endpoint under `/api/v1/`.
2. **Server Actions are optional and web-only.** Use them for small web UX helpers if useful; they must call `lib/services`, not replace the API.
3. **Business logic lives in services.** Route Handlers stay thin: auth → validate → service → response.
4. **No NestJS.** Backend logic stays inside the `equus` Next.js app unless a future scale milestone forces extraction (not planned for MVP).

---

## 3. Web frontend

### 3.1 Next.js

- App Router, React 19, TypeScript
- Server Components where they reduce client bundle size
- Client Components for interactivity (forms, dialogs, tables)

Use Next.js for:
- Owner, stable, and trainer dashboards
- Business and horse profile pages
- Future marketplace/SEO pages

### 3.2 UI — shadcn/ui only

All web UI components come from **shadcn/ui** (built on Radix + Tailwind).

- Install primitives via the shadcn CLI into `equus/components/ui/`
- Compose feature UI from shadcn primitives (`Button`, `Input`, `Dialog`, `Table`, `Form`, etc.)
- Do not add parallel component libraries (MUI, Chakra, etc.) unless shadcn cannot cover a specific need

Forms on web use **shadcn Form** + **react-hook-form** + **Zod** resolver so client validation matches API schemas.

### 3.3 Styling

- Tailwind CSS for layout and spacing
- Follow shadcn theming (CSS variables, `components.json`)
- Keep custom CSS minimal

---

## 4. Mobile

- **React Native (Expo)** + TypeScript
- Calls the same REST API as web (`https://api.example.com/api/v1/...` or env-based base URL)
- Auth via JWT (not Auth.js cookies)
- UI: React Native component library TBD when mobile work starts (separate from shadcn; shadcn is web-only)

Mobile repo/folder (when created):

```text
mobile/                   # Expo app (future)
  src/
    api/                  # typed client for /api/v1
    screens/
    auth/                 # token storage (SecureStore)
```

---

## 5. Backend — REST API

### 5.1 Route Handlers

Versioned REST under `equus/app/api/v1/`:

| Area | Prefix | Examples |
|------|--------|----------|
| Auth | `/api/v1/auth` | `login`, `register`, `refresh`, `logout` |
| Users | `/api/v1/users` | profile, account context |
| Horses | `/api/v1/horses` | CRUD, gallery |
| Relationships | `/api/v1/relationships` | request, accept, decline, invite |
| Bookings | `/api/v1/bookings` | create, accept, decline |
| Notifications | `/api/v1/notifications` | list, mark read |

### 5.2 Conventions

- **Methods:** `GET` read, `POST` create/action, `PATCH` partial update, `DELETE` remove
- **Responses:** JSON with consistent shape (`{ data }` or `{ error: { code, message } }`)
- **Status codes:** `200/201` success, `400` validation, `401` unauthenticated, `403` forbidden, `404` not found, `409` conflict
- **Versioning:** `/api/v1` prefix; bump only on breaking changes

### 5.3 Request flow (every mutating endpoint)

```text
1. Authenticate (session cookie on web API calls, Bearer JWT on mobile)
2. Parse body/query with Zod schema
3. Call lib/services/<domain>.ts
4. Return typed JSON response
```

---

## 6. Validation and sanitization — Zod

Zod is the single validation layer for API input and shared forms.

### 6.1 Where schemas live

```text
equus/lib/validations/
  auth.ts
  horse.ts
  relationship.ts
  booking.ts
  common.ts              # shared primitives (objectId, email, pagination)
```

### 6.2 Rules

- **Every** Route Handler that accepts input must validate with Zod before calling services
- Use `.trim()`, `.toLowerCase()` on emails, `.max()` on strings, enums aligned with `equus/utils/enums.ts`
- Reject unknown keys with `.strict()` on object schemas where appropriate
- Share the same schema (or `pick`/`omit` variants) between API and web forms via `@hookform/resolvers/zod`
- Do not trust client input; Mongoose validates persistence shape, Zod validates API boundary

### 6.3 Example pattern

```ts
// lib/validations/horse.ts
import { z } from "zod";

export const createHorseSchema = z.object({
  name: z.string().trim().min(1).max(120),
  breed: z.string().trim().min(1),
  sex: z.enum(["Stallion", "Mare", "Gelding", "Colt", "Filly"]),
});

// app/api/v1/horses/route.ts
const body = createHorseSchema.parse(await request.json());
await horseService.create(body, userId);
```

---

## 7. Authentication

### 7.1 Web — Auth.js

- Auth.js v5 for Next.js
- Credentials + social providers (Google/Apple) when ready
- Session cookies; use `auth()` in middleware and server components
- Protect web routes via middleware

### 7.2 Mobile — JWT

- `POST /api/v1/auth/login` → access token + refresh token
- `POST /api/v1/auth/refresh` → new access token
- Store refresh token in Expo SecureStore
- Send `Authorization: Bearer <accessToken>` on API requests
- Invalidate sessions via `User.refreshSessionVersion` on password change/reset

### 7.3 Shared identity

- One `User` document in MongoDB for both clients
- Email verification before sensitive actions
- Active account context (stable, trainer, horse, etc.) returned in API responses

---

## 8. Data layer

### 8.1 MongoDB + Mongoose

- **MongoDB Atlas** for hosting (backups, scaling)
- Models in `equus/models/` (see `equus/AGENTS.md` for naming rules)
- Connection helper in `equus/lib/db.ts`
- Relationships between horses and providers live in the `Relationship` collection, not as loose fields on `Horse`

### 8.2 Why MongoDB (decided)

- Models and enums already implemented in `equus`
- Document model fits profiles, embedded media metadata, and flexible horse records
- References (`ObjectId`) handle relational queries; indexes support provider-side lookups
- Faster MVP iteration than migrating mid-build

---

## 9. Media, notifications, realtime

### 9.1 Cloudinary (decided)

**All uploads** go through Cloudinary for MVP and the foreseeable roadmap:

- Horse photos, stable galleries, trainer videos, profile images, documents (passport, contracts, PDFs)
- Do not store binary files in MongoDB
- Store `url` + `publicId` on models (see `sharedSchemas/mediaAsset.ts`)
- Cloudinary handles resize, compression, transformations, and CDN delivery

S3/R2 is not planned unless Cloudinary cost becomes a business problem at scale.

### 9.2 Notifications

- **In-app:** `Notification` model, polled or pushed via API
- **Push:** Firebase Cloud Messaging (Android, iOS, web)

### 9.3 Live chat — realtime (TypeScript, inside Equus)

Live chat is open between users (see `businessPlan.md`). Realtime delivery can stay **inside the Next.js Node process** — no separate websocket microservice for MVP.

#### Can Next.js handle WebSockets?

**Yes**, when you run Equus as a **long-lived Node server** (Docker/VPS or similar), not pure serverless-only:

- App Router Route Handlers are **HTTP-only** — they do not upgrade to WebSocket by themselves
- Use a **custom Node entry** (`server.ts`) that starts Next.js and attaches a WebSocket layer on the same port or a dedicated path
- Implement in **TypeScript** with `ws` or **Socket.io** (Socket.io has solid React Native clients)

```text
Custom Node server (server.ts)
  ├── Next.js request handler  → pages + /api/v1/* REST
  └── WebSocket / Socket.io    → /api/ws or /socket.io  → live chat
           │
           └── lib/chat/connectionRegistry.ts  (in-memory per process)
           └── MongoDB                          (message persistence)
```

**MVP path**

1. **Phase 1 (optional):** REST send message + short polling or “fetch on focus” — simplest, no custom server yet
2. **Phase 2 (recommended for live feel):** custom `server.ts` + Socket.io + JWT auth on connect + persist messages in MongoDB

**Single-server deployment** (one Node instance): in-memory connection registry is enough — same pattern as `restaurant-pos` live chat registry. **No Redis required.**

**When to extract a dedicated websocket service** (true post-MVP / scale):

- Multiple Node instances behind a load balancer (horizontal scale)
- WebSocket connections spread across machines need a **pub/sub bus** (e.g. Socket.io Redis adapter) *or* a single dedicated realtime service
- Until then, keep realtime in Equus

#### What we are not doing for chat

- Separate NestJS/Fastify websocket gateway
- Python or non-TypeScript realtime stack
- Redis for MVP chat (not needed on one Node instance)

---

## 10. Folder structure

```text
horse/
  documentation/
  equus/                              # Next.js web + API
    app/
      (routes)/                       # pages and layouts
      api/v1/                         # REST API
    components/
      ui/                             # shadcn primitives
      ...                             # feature components (compose from ui/)
    lib/
      auth/                           # Auth.js config, JWT helpers
      validations/                    # Zod schemas
      services/                       # domain logic
      chat/                           # websocket registry + message handlers (when live)
      db.ts                           # MongoDB connection
    server.ts                         # custom Node entry (Next.js + WebSocket when chat ships)
    models/                           # Mongoose models
    utils/                            # enums, shared helpers
    AGENTS.md
  mobile/                             # Expo app (when started)
```

---

## 11. What we are not using

| Technology | Reason |
|------------|--------|
| **NestJS** | Extra app and deploy surface; Next.js API + services is enough for MVP and dual clients |
| **Server Actions as main API** | Not accessible from React Native |
| **Non-shadcn UI libraries** | One web component system; shadcn + Tailwind |
| **Validation without Zod** | Single schema source for API and forms |
| **Custom auth** | Auth.js + JWT endpoints on proven `User` model |
| **PostgreSQL (MVP)** | Already committed to Mongoose models |
| **Redis** | Not needed for MVP; single Node instance + MongoDB + JWT is enough (see §12) |
| **Python** | 100% TypeScript codebase |
| **Fastify / separate HTTP server** | REST lives in Next.js Route Handlers; restaurant-pos pattern reused without Fastify |
| **S3/R2 (for now)** | Cloudinary is the upload store |

---

## 12. Deferred (post-MVP)

Items we may add later. Nothing here is required to ship Phase 1A/1B.

| Item | When to reconsider | Notes |
|------|-------------------|--------|
| **Dedicated websocket service** | Multiple app instances behind a load balancer; chat connections no longer share one Node process | Until then, WebSockets stay in custom `server.ts` inside Equus (§9.3) |
| **Redis** | Horizontal scale with Socket.io across several Node instances | **Not for caching MVP.** JWT auth does not need Redis sessions. MongoDB + indexes cover data. Redis only matters if you shard realtime across machines (Socket.io adapter) or add BullMQ-style job queues later |
| **S3/R2 + custom image pipeline** | Cloudinary bill becomes material | Cloudinary remains the default upload path |
| **Extracted backend API** | Large team, public partner API, or Next.js frontend-only split | Stay monolithic in `equus` until then |
| **AI features (summaries, doc extraction)** | Product priority after core ops are live | Implement in **TypeScript** (e.g. calling external LLM APIs from `lib/services`), not a Python microservice |

### Redis — do we need it?

**No, not for MVP or early production on a single server.**

| Use case | MVP approach |
|----------|----------------|
| Auth sessions | Auth.js cookies (web) + JWT (mobile); `User.refreshSessionVersion` in MongoDB |
| Chat realtime | In-memory registry on one Node process |
| Notifications / data | MongoDB |
| Rate limits | In-route or MongoDB counters |

Add Redis only if you run **multiple Equus instances** and need Socket.io to broadcast across them, or if you introduce Redis-backed job queues at scale.

---

## 13. Implementation order

1. `lib/db.ts` — MongoDB connection
2. `lib/validations/*` — Zod schemas for auth and core entities
3. Auth.js (web) + `/api/v1/auth/*` (mobile JWT)
4. shadcn setup + base layout shell
5. `/api/v1/horses`, `/api/v1/relationships` + services
6. Web dashboards consuming the API
7. Expo app against the same `/api/v1` base URL
8. Live chat: REST messages first, then `server.ts` + Socket.io when realtime is required (§9.3)

---

## 14. Principles

Optimize for:

1. **Shipping MVP** — owners, stables, trainers using the product daily
2. **One API contract** — web and mobile never diverge on business rules
3. **Type safety end-to-end** — TypeScript + Zod at boundaries
4. **Consistency** — shadcn on web, Zod on input, services for logic
5. **Customer learning** over infrastructure debates

The competitive advantage is understanding horse businesses, not the choice of ORM or websocket library.
