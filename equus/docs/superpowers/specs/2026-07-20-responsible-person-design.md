# Horse Responsible Person Role — Design

**Date:** 2026-07-20
**Scope:** Add "responsible person" role to horse administration. Extend admin tabs to co-owners and responsible persons. Main owner retains exclusive Admin tab access.

---

## Role Hierarchy

| Role | Edit horse data | Edit/Connect tabs | Admin tab | Manage ownership | Manage responsibles |
|------|:---:|:---:|:---:|:---:|:---:|
| Owner (main) | Yes | Yes | Yes | Yes | Yes |
| Co-owner | Yes | Yes | No | No | No |
| Responsible | Yes | Yes | No | No | No |

---

## 1. Data Model Changes

### Horse model — new `responsibles` field

```ts
responsibles: {
  type: [{ userId: Schema.Types.ObjectId, ref: "User", required: true }],
  default: undefined,
}
```

### OwnershipTransfer — new transfer kinds

| Kind | Initiator | Effect on accept |
|------|-----------|------------------|
| `add_responsible` | Main owner | `$push { userId }` to `horse.responsibles[]` |
| `remove_responsible` | Main owner | `$pull { userId }` from `horse.responsibles[]` |

Validation: initiator must be main owner. Prevent duplicates. Target user must exist.

### OwnerHorseHubSummary — new fields

```ts
isMainOwner: boolean;       // existing, unchanged
isCoOwner: boolean;         // NEW
isResponsible: boolean;     // NEW
isAdmin: boolean;           // NEW = isMainOwner || isCoOwner || isResponsible
responsibles: { userId, label }[];  // NEW
```

---

## 2. Access Helpers

### `entityOwnership.ts` — add responsibles to all access checks

`ownedByUserQuery`, `userOwnsEntity`, `userHasOwnerAccess` — add `{ "responsibles.userId": objectId }` clause.

### `horseService.ts` — compute role flags

```ts
const isMainOwner = String(horse.mainOwnerUserId) === actorUserId;
const isCoOwner = horse.coOwners?.some(c => String(c.userId) === actorUserId) ?? false;
const isResponsible = horse.responsibles?.some(r => String(r.userId) === actorUserId) ?? false;
const isAdmin = isMainOwner || isCoOwner || isResponsible;
```

---

## 3. EntityTabs — dual role filtering

```ts
interface EntityTab {
  id: string; label: string; href: string;
  requireOwnership?: boolean;   // visible when isAdmin
  requireMainOwner?: boolean;   // visible only when isMainOwner
}

interface EntityTabsProps {
  tabs: EntityTab[];
  isAdmin: boolean;           // renamed from isOwner
  isMainOwner?: boolean;      // NEW
  isPending?: boolean;
  variant?: "default" | "header";
}

// Filter
const visibleTabs = tabs.filter((t) => {
  if (t.requireMainOwner) return isMainOwner;
  if (t.requireOwnership) return isAdmin;
  return true;
});
```

### horseTabs.ts

```ts
{ id: "admin", label: "Admin", href: `/horses/${horseId}/sale`, requireOwnership: true, requireMainOwner: true },
{ id: "connect", label: "Connect", href: `/horses/${horseId}/connect`, requireOwnership: true },
{ id: "edit", label: "Edit", href: `/horses/${horseId}/edit`, requireOwnership: true },
```

---

## 4. HorsePageShell — dual gating

```tsx
type HorsePageShellProps = {
  horseId: string;
  requireOwnership?: boolean;    // gates on isAdmin
  requireMainOwner?: boolean;    // gates on isMainOwner
  children: ...;
};

const isMainOwner = horse?.isMainOwner ?? false;
const isAdmin = horse?.isAdmin ?? false;

<EntityTabs tabs={...} isAdmin={isAdmin} isMainOwner={isMainOwner} isPending={isLoading} variant="header" />

const blocked = (requireMainOwner && !isMainOwner) || (requireOwnership && !isAdmin);
```

---

## 5. Admin Tab — Responsible Persons UI

New section in `horse-admin-page-content.tsx` (below existing ownership hub, gated behind `isMainOwner`):

- **Active list** — current responsible persons with name + remove button
- **Invite form** — email input, creates `add_responsible` OwnershipTransfer
- **Pending list** — outbound pending `add_responsible` / `remove_responsible` transfers with cancel buttons
- Reuses existing `useOwnershipTransfer` hooks and invite component patterns

---

## 6. Files Summary

| Action | File |
|--------|------|
| **Modify** | `equus/utils/enums.ts` — add transfer kind enums |
| **Modify** | `equus/models/Horse.ts` — add `responsibles` field |
| **Modify** | `equus/lib/ownership/entityOwnership.ts` — include responsibles |
| **Modify** | `equus/lib/services/horseService.ts` — compute role flags |
| **Modify** | `equus/lib/services/ownershipTransferService.ts` — handle add/remove responsible |
| **Modify** | `equus/lib/api/horseClient.ts` — update OwnerHorseHubSummary type |
| **Modify** | `equus/lib/navigation/horseTabs.ts` — add requireMainOwner to admin |
| **Modify** | `equus/components/shared/entity-tabs.tsx` — isAdmin + isMainOwner |
| **Modify** | `equus/components/horses/horse-page-shell.tsx` — dual gating |
| **Modify** | `equus/components/horses/horse-admin-page-content.tsx` — responsible UI |
| **Create** | `equus/components/horses/ownership/responsible-list.tsx` |
| **Create** | `equus/components/horses/ownership/invite-responsible-form.tsx` |
| **Modify** | `equus/hooks/queries/useHorse.ts` — update types |
| **Modify** | `equus/messages/en.json` — translations |
| **Modify** | `equus/messages/es.json` — translations |
| **Modify** | `equus/tests/lib/ownership/entityOwnership.test.ts` — tests |
| **Create** | `equus/tests/lib/services/ownershipTransferService.responsible.test.ts` — tests |
