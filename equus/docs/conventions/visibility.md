# Visibility model

The visibility rules for horses and users. Two independent layers; layer-1 gates whole-profile access, layer-2 gates individual Hub content blocks.

## Shared section visibility (Layer 2)

* Shared `SectionVisibilityControl` + `Section` `visibilityControl` slot; entity adapters own PATCH. Horse: `HorseSectionVisibility` → `PATCH /api/v1/horses/:id/hub-sections` (Profile, Admin, Media Gallery, Planning, Connect Connections). Modes `public` | `relationship` | `owner`. Never parent form dirty/Save for section modes. New entity: add `*SectionVisibility` adapter + entity PATCH; reuse control unchanged. Types: `lib/visibility/sectionVisibility.ts`.

## Horse visibility

* **Visibility UI vs discovery API** — Admin **Visibility** section edits Layer-1 `profileVisibility` via `useUpdateHorseVisibility` → `PATCH /api/v1/horses/:id/discovery` (same discovery contract as other entities). Do not rename the REST discovery path or Mongo field names in a horse-only UI cleanup.
* **Horse visibility policy** — owner audience = ownership team (`userOwnsEntity`). Relationship audience = team + accepted `Relationship` + active host-entity workplace collaborators (stable/breeder/transport/ridingClub). Three controls: tabs = `viewerRole` → `allowedTabs` (role-based); Layer 1 = `profileVisibility` (open/404); Layer 2 = `hubSections[key]` (Hub content blocks, independent of role). Hub-facing cheap keys: `identity` | `identification` | `pedigree` | `about` | `ownership` | `value` | `proactiveRepresentatives` | `coOwnerManagement`; list keys: `gallery` | `planning` | `connections` (`GET …/hub-social`). Item modes `entities` map to `relationship`. Enforce in `lib/horses/horseVisibilityAccess.ts`; Hub renders only `horse.sections` keys present; media/planning lists enforce L1→L2 (owner team full list).

## User visibility

* **User visibility** — Layer-1 `preferences.profileVisibility` (public/platform/relationships/private) on the Preferences tab; Layer-2 `hubSections[key]` (`identity` | `identification` | `address` | `contact` | `entities`, modes `public` | `relationship` | `owner`). Enforce in `lib/privacy/userPublicProfile.ts` (`getUserHub`); owner view seeds `user.sections` via `getUserView`. Popovers live on the Profile tab sections (Personal/Identification/Address → `UserSectionVisibility` → `PATCH /api/v1/users/me/hub-sections`), not on the hub.

Canonical detail: [equus/docs/engineering/page-flow-blueprint.md](../engineering/page-flow-blueprint.md) §1/§12, [equus/docs/engineering/entities/horses.md](../engineering/entities/horses.md), [equus/docs/engineering/users.md](../engineering/users.md), [equus/docs/engineering/horseTabs.md](../engineering/horseTabs.md), [equus/docs/engineering/userTabs.md](../engineering/userTabs.md).
