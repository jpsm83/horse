# RHF + TanStack Robustness Standardization — Design Spec

**Date:** 2025-07-19
**Scope:** restaurant-pos and equus (health is untouched)
**Goal:** Make React Hook Form + Zod + TanStack Query the mandatory, consistently-used standard for all forms and data operations in both apps. Fix critical gaps (horse forms with no validation, bare `fetch()` calls bypassing TanStack mutations) and add field-level server error mapping.

---

## Problem

Both apps already have the libraries installed (RHF, Zod, TanStack Query, TanStack Table) and partially use them, but several inconsistencies and gaps undermine robustness:

1. **equus HorseEditForm and HorseSaleForm have NO Zod validation** — name, breed, sex, price, currency are unvalidated at the frontend level
2. **Multiple forms bypass TanStack mutations** — HorseEditForm, HorseSaleForm, CreateHorseForm (equus) and LoginPage/SignUpPage (restaurant-pos) use bare `fetch()`/Axios calls instead of `useMutation`
3. **No server error to form field mapping** — when the backend returns `{ message: "Email already exists" }`, it only shows in a generic top-of-form `Alert`; the actual `email` field never lights up with an error via RHF's `setError`
4. **Inconsistent patterns** — auth pages use `state.status === "loading"`, business forms use `mutation.isPending`, some pages show `<FieldError>` and some don't
5. **No documented convention** — restaurant-pos has no AGENTS.md specifying what patterns are mandatory

---

## Audit

### restaurant-pos

| File | RHF | Zod | TanStack Mutation | FieldError | Server→Field Map |
|------|-----|-----|-------------------|------------|------------------|
| LoginPage.tsx | ✅ | ✅ | ❌ (raw fetch) | ✅ | ❌ |
| SignUpPage.tsx | ✅ | ✅ | ❌ (raw fetch) | ✅ | ❌ |
| BusinessRegisterPage.tsx | ✅ | ✅ | ✅ | ✅ | ❌ |
| BusinessProfileSettingsFormShell | ✅ | ✅ | ✅ | ✅ | ❌ |
| BusinessAddressSettingsPage | ✅ | ✅ | ✅ | ❌ (no FieldError) | ❌ |
| BusinessDeliverySettingsPage | ✅ | ✅ | ✅ | ❌ (no FieldError) | ❌ |
| BusinessOpenHoursSettingsPage | ✅ | ✅ | ✅ | ❌ (no FieldError) | ❌ |
| BusinessMetricsSettingsPage | ✅ | ✅ | ✅ | ❌ (no FieldError) | ❌ |

### equus

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

### Phase 1 — Document Standards

Create `restaurant-pos/AGENTS.md` with the RHF + Zod + TanStack mandatory standards, mirroring equus's existing conventions. Codify:

- All forms MUST use React Hook Form. No bare `useState` for form state.
- All forms MUST validate with Zod schemas via `@hookform/resolvers/zod`.
- All API writes MUST use TanStack `useMutation`. No bare `fetch()` or `axios.post()`.
- All API reads MUST use TanStack `useQuery`. No `useEffect` + `fetch()`.
- Auth forms (login, signup, password reset) are an **explicit exception** to the `useMutation` rule (redirects happen, no caching needed).

### Phase 2 — equus: Fix Critical Horse Forms

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

### Phase 3 — equus: Pattern Alignment

**ProfileForm** (`equus/components/profile/profile-form.tsx`):
- Extract `updateUserProfile` direct call → `useUpdateProfile` mutation hook in `hooks/queries/useCurrentUser.ts`
- `onSuccess`: invalidate `queryKeys.users.me`, show success toast
- `onError`: show error toast, optionally map server field errors

### Phase 4 — restaurant-pos: Server Error → Form Field Mapping

Backend changes (restaurant-pos):

- Update `HttpErrorShape` and error helpers (`badRequest`, etc.) to accept optional `fields: Record<string, string>`
- Update `server.setErrorHandler` to pass through `fields` in the response body
- Update route validation handlers to return field-level errors where feasible

Frontend changes (restaurant-pos):

- Extend `ServiceRequestError` with `fields?: Record<string, string>`
- `toServiceRequestError()` parses `fields` from response body
- New utility: `mapServerErrorsToForm(setError: UseFormSetError<T>, fields?: Record<string, string>)` — iterates fields and calls `setError` for each
- Integrate into `useBusinessProfileSettingsController`: in the `catch` block of `onSubmit`, call `mapServerErrorsToForm`
- The top-level `submitError` `Alert` remains as a fallback when `fields` is undefined

Response body format:

```json
{
  "message": "Validation failed",
  "fields": {
    "email": "A business with this email already exists",
    "taxNumber": "Invalid tax ID format"
  }
}
```

### Phase 5 — restaurant-pos: Consistency Cleanup

- LoginPage/SignUpPage: migrate from `{ ok, data, error }` fetch pattern to Axios + TanStack mutations (or document as exception like equus auth)
- Split settings pages: add `<FieldError>` to fields currently missing it (Address, Delivery, Hours, Metrics, Subscriptions)
- Standardize submit button loading: use `mutation.isPending` uniformly

### Phase 6 (Optional) — Shared `useFormMutation` Hook

Build a reusable hook in `restaurant-pos/frontend/src/hooks/useFormMutation.ts`:

```typescript
interface UseFormMutationOptions<TForm, TDto, TPayload> {
  query: () => UseQueryResult<TDto>;
  mutation: () => UseMutationOptions<TPayload>;
  schema: (messages: Record<string, string>) => ZodType<TForm>;
  dtoToForm: (dto: TDto) => TForm;
  formToPayload: (values: TForm) => TPayload;
  onSuccess?: { toast: string; invalidateKeys?: string[][] };
}

function useFormMutation<TForm, TDto, TPayload>(opts: UseFormMutationOptions) {
  // gate: loading → skeleton, error → alert, ready → form
  // useForm with zodResolver
  // useMutation (TanStack)
  // onSubmit: validate → mutateAsync → reset() with fresh data
  // onError: mapServerErrorsToForm
  // return: { register, control, errors, isDirty, isPending, handleSubmit, handleReset }
}
```

Adopt in restaurant-pos first, then port to equus if the pattern proves useful.

---

## Non-Goals

- Not touching the `health/` app
- Not rewriting all existing working forms that follow the correct pattern (only fixing those that deviate)
- Not creating a shared npm package — patterns are duplicated deliberately so each app can evolve independently
- Not changing API response formats in equus (phases 2-3 only change frontend code)
- Not adding `useSuspenseQuery` (documented but not yet adopted)
- Not building a visual form builder or form generator

---

## Success Criteria

1. **Zero forms without Zod validation** in equus (HorseEditForm, HorseSaleForm get Zod schemas)
2. **Zero bare `fetch()` calls for writes** in equus that have an existing mutation hook (CreateHorseForm uses `useCreateHorse`)
3. **HorseEditForm and HorseSaleForm** use TanStack mutations with query invalidation
4. **ProfileForm** uses TanStack mutation instead of direct `updateUserProfile` call
5. **ServiceRequestError** carries `fields` and `toServiceRequestError` parses them from the response
6. **`mapServerErrorsToForm` utility** exists and is integrated into the business profile form shell
7. **restaurant-pos AGENTS.md** documents the mandatory RHF + Zod + TanStack pattern
8. **All existing tests pass** in both apps
