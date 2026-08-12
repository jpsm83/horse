# RHF + TanStack Robustness Standardization — Design Spec

**Date:** 2025-07-19
**Scope:** equus only (restaurant-pos and health are reference projects, not touched)
**Goal:** Make React Hook Form + Zod + TanStack Query the mandatory, consistently-used standard for all forms and data operations in equus. Fix critical gaps (horse forms with no validation, bare `fetch()` calls bypassing TanStack mutations).

---

## Problem

The equus app already has the libraries installed (RHF v7.80, Zod v4.4, TanStack Query v5, TanStack Table v8) and partially uses them, but several inconsistencies and gaps undermine robustness:

1. **HorseEditForm and HorseSaleForm have NO Zod validation** — name, breed, sex, price, currency are unvalidated at the frontend level
2. **Multiple forms bypass TanStack mutations** — HorseEditForm, HorseSaleForm, CreateHorseForm, ProfileForm use bare `fetch()` calls instead of `useMutation`
3. **CreateHorseForm ignores existing `useCreateHorse` hook** — a bare `fetch()` is used even though the mutation hook already exists in the codebase
4. **ProfileForm uses direct API calls** — calls `updateUserProfile` directly instead of using a `useMutation` hook with automatic query invalidation

---

## Audit

| File | RHF | Zod | TanStack Mutation | FieldError | Notes |
|------|-----|-----|-------------------|------------|-------|
| SignInContent | ✅ | ✅ | ❌ (raw fetch) | ✅ | Auth — acceptable exception |
| SignUpContent | ✅ | ✅ | ❌ (raw fetch) | ✅ | Auth — acceptable exception |
| ForgotPasswordContent | ✅ | ✅ | ❌ (raw fetch) | ✅ | Auth — acceptable exception |
| ResetPasswordContent | ✅ | ✅ | ❌ (raw fetch) | ✅ | Auth — acceptable exception |
| ProfileForm | ✅ | ✅ | ❌ (raw fetch, manual invalidation) | ✅ | Should fix |
| CreateHorseForm | ✅ | ✅ | ❌ (bare fetch, `useCreateHorse` exists) | ✅ | Should fix |
| HorseEditForm | ✅ | ❌ | ❌ (bare fetch) | ❌ | **Critical** — no validation |
| HorseSaleForm | ✅ | ❌ | ❌ (bare fetch) | ❌ | **Critical** — no validation |

---

## Phases

### Phase 1 — Fix Critical Horse Forms

**HorseEditForm** (`equus/components/horses/horse-edit-form.tsx`):
- Add Zod schema: `name` required (min 2 chars), `breed` required, `sex` required enum (male/female/gelding)
- Create `useUpdateHorse` mutation hook in `hooks/queries/useHorse.ts`
- Replace bare `fetch()` → `useUpdateHorse` mutation
- Add `<FieldError>` for all fields

**HorseSaleForm** (`equus/components/horses/horse-sale-form.tsx`):
- Add Zod schema: `price` required positive number, `currency` required string, `saleStatus` required enum
- Create `useUpdateHorseSale` mutation hook in `hooks/queries/useHorse.ts`
- Replace bare `fetch()` → mutation hook
- Add `<FieldError>` for all fields

**CreateHorseForm** (`equus/components/horses/create-horse-form.tsx`):
- Replace bare `fetch()` → existing `useCreateHorse` mutation hook
- Add query invalidation on success

### Phase 2 — Pattern Alignment

**ProfileForm** (`equus/components/profile/profile-form.tsx`):
- Extract `updateUserProfile` direct call → `useUpdateProfile` mutation hook in `hooks/queries/useCurrentUser.ts`
- `onSuccess`: invalidate `queryKeys.users.me`, show success toast
- `onError`: show error toast, optionally map server field errors

---

## Non-Goals

- Not touching `restaurant-pos/` or `health/` apps
- Not rewriting auth forms (SignIn, SignUp, ForgotPassword, ResetPassword) — they are documented exceptions
- Not changing API response formats
- Not adding `useSuspenseQuery` (documented but not yet adopted)

---

## Success Criteria

1. **Zero forms without Zod validation** in equus (HorseEditForm, HorseSaleForm get Zod schemas)
2. **Zero bare `fetch()` calls for writes** in equus that have an existing mutation hook (CreateHorseForm uses `useCreateHorse`)
3. **HorseEditForm and HorseSaleForm** use TanStack mutations with query invalidation
4. **ProfileForm** uses TanStack mutation instead of direct `updateUserProfile` call
5. **All existing tests pass**
