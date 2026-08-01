# Horse Hub About + Value + Section Projections — Design

Date: 2026-08-01

## Goal

Make the Horse Hub respect Layer 2 section visibility for ALL sections, including `value`, `proactiveRepresentatives`, and `coOwnerManagement`. Wire the Hub About section to show the profile description, and rename the Hub Description section to Value with a read-only view of the Admin Horse Value fields.

## The Three-Control Visibility Model

There are exactly three independent controls. Only Layer 2 is being changed.

### Layer 1 — `Horse.profileVisibility`

- **What it gates**: whether the viewer can access the horse at all.
- **Enforcement**: `assertCanViewHorseGlobal()` throws `ApiError(404, "Horse not found")` on deny.
- **Modes**: `public` / `relationship` / `owner` (nested: owner ⊆ relationship ⊆ public).
- **This pass**: unchanged.

### Tabs — `viewerRole` → `allowedTabs`

- **What it gates**: which management pages appear in the sidebar (Hub, Profile, Admin, Media, Planning, Connect, etc.).
- **Derivation**: `deriveViewerRole()` → `deriveAllowedTabs()` using `TAB_MIN_ROLE` + `ROLE_ORDER`.
- **This pass**: unchanged. No role-control changes.

### Layer 2 — `horse.hubSections[key].mode`

- **What it gates**: which content blocks appear on the Hub and within management tabs.
- **Enforcement**: `canViewHorseHubSection()` — key present in the projected `sections` payload only when the mode allows the viewer's audience.
- **Modes**: same three, nested.
- **This pass**: add `value`, `proactiveRepresentatives`, `coOwnerManagement` to the set of Hub-facing keys that `buildHorseHubSections` projects. Remove the "not Hub-facing" carve-out.

### Key property

Layer 2 is **independent of viewer role**. A guest with `hubSections.value.mode = "public"` sees Value on the Hub even though they never receive the Admin tab. The Hub renders only what Layer 2 allows, regardless of who is signed in.

## Architecture

Keep three separate controls:

1. `viewerRole` / `allowedTabs` — tab edit access (role-based).
2. Layer 1 `profileVisibility` — horse open (404).
3. Layer 2 `hubSections[key]` — Hub content blocks.

Flow:

```
Viewer
  ├─ Layer 1: can they open the horse at all?   (deny = 404)
  ├─ Tabs:    which management pages appear?     (role-based, unchanged)
  └─ Layer 2: which Hub content blocks appear?   (per-section mode)
```

The Hub renders only keys present in `horse.sections` — never ship forbidden data and hide it in React.

## API Changes (`equus/lib/services/horseService.ts`)

### New types

```ts
HorseHubValueSection {
  saleStatus?: string;
  askingPrice?: number;
  estimatedValue?: number;
  valueCurrency?: string;
  acquisitionDate?: string; // ISO date string
  acquisitionSourceUser?: { userId: string; name?: string; imageUrl?: string };
}

HorseHubProactiveRepresentativesSection {
  members: Array<{ userId: string; name?: string; imageUrl?: string }>;
}

HorseHubCoOwnerManagementSection {
  members: Array<{ userId: string; name?: string; imageUrl?: string }>;
}
```

Extend `HorseHubDto["sections"]` (and therefore `HorseViewDto.sections`) with:
- `value?: HorseHubValueSection`
- `proactiveRepresentatives?: HorseHubProactiveRepresentativesSection`
- `coOwnerManagement?: HorseHubCoOwnerManagementSection`

### `buildHorseHubSections` changes

Add `value`, `proactiveRepresentatives`, `coOwnerManagement` to the projection loop, each gated by `canViewHorseHubSection(horseDoc, key, audience)`:

- **value**: map `saleStatus`, `askingPrice`, `estimatedValue`, `valueCurrency`, `acquisitionDate` (ISO string) from `horseDoc`.
- **proactiveRepresentatives** / **coOwnerManagement**: project as `{ members: [] }` — enrichment happens in `getHorseView` so names resolve consistently.

### `getHorseView` changes

- After `buildHorseHubSections`, if `sections.value` is present → resolve `acquisitionSourceUser` onto it (reuse existing fallback-to-main-owner logic).
- If `sections.proactiveRepresentatives` / `sections.coOwnerManagement` are present → resolve responsibles / co-owners into Hub-safe member lists (name + image; no phone; no email on Hub projections).
- These enrichments must NOT require `audience.isOwnerTeam` — only Layer 2 + Layer 1.
- The owner-team flat fields (`estimatedValue`, `coOwners`, `responsibles`, `adminTeam`, etc.) remain appended inside the existing `if (audience.isOwnerTeam)` block, unchanged, for Admin tab consumption.

### `getHorseHub`

No changes needed — it calls `buildHorseHubSections` and naturally picks up the new keys when Layer 2 allows.

## Hub UI Changes

### Left column order

`About` → `Disciplines` → `Value` (was `Description`).

### `horse-hub-about.tsx`

- Accept horse data from `useHorseView`.
- If `horse.sections.about` absent → return `null`.
- If present → Section titled "About" showing the description text, or an empty-state message when empty.
- No metadata rows, no disciplines in this component.

### `horse-hub-description.tsx` → `horse-hub-value.tsx`

- Rename file; export `HorseHubValue`.
- Update `HubContent` imports/usage in `client.tsx`.
- If `horse.sections.value` absent → return `null`.
- If present → read-only display of the Admin Horse Value fields (exact Admin subset):
  - Sale status label
  - Asking price when `saleStatus === "for_sale"`
  - Estimated value + currency
  - Acquisition date
  - Acquisition source `EntityChip` when present

### Placeholders

`HorseHubDisciplines`, `HorseHubGallery`, `HorseHubPedigree`, `HorseHubPeople` remain unchanged placeholders.

### i18n

- No hardcoded Hub copy.
- Rename Hub key `description` → `value` (and empty-state labels).
- Reuse existing `horseSale` labels where appropriate to avoid duplicating enum copy.
- Update `equus/messages/en.json` + `equus/messages/es.json`.

## Tests (`equus/tests/lib/services/horseHubSections.test.ts`)

| Case | Expectation |
|------|-------------|
| Guest + value:public | `sections.value` present with sale/commercial fields |
| Guest + value:owner (default) | `sections.value` is `undefined` |
| Related + value:relationship | `sections.value` present |
| Owner team + value:owner | `sections.value` present |
| Guest + proactive/coOwner:public | keys present with member arrays |
| Guest + proactive/coOwner:owner | keys absent |
| Owner team + all default modes | all 8 keys present (identity, identification, pedigree, about, ownership, value, proactiveRepresentatives, coOwnerManagement) |

## Documentation Cleanup

Documentation must reflect what is correct and in use right now — remove stale descriptions of the old behavior.

| File | Change |
|------|--------|
| `equus/documentation/horses.md` | Remove "not Hub-facing" for value/proactive/coOwner; update Hub tree (About = description; Value replaces Description); clarify L1 vs tabs vs L2; Hub-facing cheap keys list. |
| `equus/documentation/horseTabs.md` | Same Hub tree + visibility note. |
| `equus/documentation/page-flow-blueprint.md` | Hub-facing keys list; same three-control wording. |
| `equus/AGENTS.md` | Hub-facing keys list; same three-control wording; remove Admin-only carve-out language. |

## Out of Scope

- Wiring Disciplines, Gallery, Pedigree, People Hub zones.
- Hub UI blocks dedicated to `proactiveRepresentatives` / `coOwnerManagement` (API only; People zone later).
- Changing Layer 1 semantics, tab roles, or default modes.
- Moving list sections (gallery, planning, connections) into `buildHorseHubSections`.
- Refactoring Admin tab components or the owner-team flat fields.

## Verification

- `npm test -- tests/lib/services/horseHubSections.test.ts` (and any new related tests) — all pass.
- Grep for stale strings: `HorseHubDescription`, `not Hub-facing`, Hub "description" zone title misuse.
- Rational check: guest + L1 public + about/value public sees About + Value on Hub; guest has no Admin tab; owner with default value sees Value on Hub; guest with default owner value does not.
