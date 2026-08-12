# RHF + TanStack Robustness Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Standardize React Hook Form + Zod + TanStack Query across equus. Fix critical gaps (unvalidated horse forms, bare `fetch()` mutations).

**Architecture:** Phased approach — fix critical horse forms first (Zod + mutations), then migrate ProfileForm to mutation pattern.

**Tech Stack:** React 19, Next.js 16, React Hook Form 7.x, Zod 4.x, TanStack React Query v5, TanStack React Table v8, shadcn/ui, TailwindCSS v4

## Global Constraints

- All forms MUST use React Hook Form. No bare `useState` for form state.
- All forms MUST validate with Zod schemas via `@hookform/resolvers/zod`.
- All API writes MUST use TanStack `useMutation`. No bare `fetch()` or `axios.post()`.
- All API reads MUST use TanStack `useQuery`. No `useEffect` + `fetch()`.
- Auth forms (login, signup, password reset) are an **explicit exception** to `useMutation` (redirects happen, no caching needed).
- Follow equus AGENTS.md conventions for forms and data fetching.
- `restaurant-pos/` and `health/` are reference-only — do not modify.

---

## File Structure

| File | Action | Responsibility |
|------|--------|----------------|
| `equus/lib/validations/horseForms.ts` | Modify | Add `editHorseFormSchema` and `saleFormSchema` exports |
| `equus/hooks/queries/useHorse.ts` | Modify | Add `useUpdateHorse`, `useUpdateHorseSale` mutation hooks |
| `equus/components/horses/horse-edit-form.tsx` | Modify | Add Zod resolver, replace bare fetch with mutation, add FieldError |
| `equus/components/horses/horse-sale-form.tsx` | Modify | Add Zod resolver, replace bare fetch with mutation, add FieldError |
| `equus/components/horses/create-horse-form.tsx` | Modify | Replace bare fetch with existing `useCreateHorse` mutation |
| `equus/hooks/queries/useCurrentUser.ts` | Modify | Add `useUpdateProfile` mutation hook |
| `equus/components/profile/profile-form.tsx` | Modify | Replace direct `updateUserProfile` call with `useUpdateProfile` mutation |

---

## Tasks

### Task 1: Add Zod Schemas for HorseEdit and HorseSale

**Files:**
- Modify: `equus/lib/validations/horseForms.ts`

**Interfaces:**
- Produces: `editHorseFormSchema`, `saleFormSchema` (Zod schemas)
- Produces: `EditHorseFormValues`, `SaleFormValues` (inferred types)

- [ ] **Step 1: Add edit and sale schemas to `horseForms.ts`**

Append after the existing exports. Add `editHorseFormSchemas` and `saleFormSchemas` factory functions with the same message-injection pattern used by `createHorseFormSchemas`. Both use the existing `requiredTrimmedString`, `optionalTrimmedString`, `requiredEnum`, `optionalEnum`, `optionalNumber` helper functions.

```typescript
export function editHorseFormSchemas(messages: HorseFormMessages) {
  const editHorseFormSchema = z.object({
    name: requiredTrimmedString(messages),
    breed: requiredEnum(horseBreedEnums, messages),
    sex: requiredEnum(horseSexEnums, messages),
    registeredName: optionalTrimmedString(120),
    registryId: optionalTrimmedString(120),
    microchipId: optionalTrimmedString(120),
    passportNumber: optionalTrimmedString(120),
    color: optionalEnum(horseColorEnums, messages),
    marksDescription: optionalTrimmedString(500),
    heightHands: optionalNumber(messages),
    dateOfBirth: z.string().refine(
      (value) => { if (value.trim() === "") return true; const date = new Date(value); return !Number.isNaN(date.getTime()); },
      { message: messages.invalidDate },
    ),
    countryOfBirth: optionalTrimmedString(100),
    importExportStatus: optionalTrimmedString(100),
    primaryDiscipline: optionalEnum(horseDisciplineEnums, messages),
    disciplines: z.array(z.enum(horseDisciplineEnums)).optional(),
    description: optionalTrimmedString(2000),
    notes: optionalTrimmedString(5000),
    pedigree: z.object({
      sireName: optionalTrimmedString(120),
      sireId: optionalTrimmedString(120),
      damName: optionalTrimmedString(120),
      damId: optionalTrimmedString(120),
      bloodlineNotes: optionalTrimmedString(1000),
    }),
  });

  return { editHorseFormSchema };
}

export function saleFormSchemas(messages: HorseFormMessages) {
  const saleFormSchema = z.object({
    saleStatus: z.enum(["not_for_sale", "for_sale"], { message: messages.invalidEnum }),
    estimatedValue: optionalNumber(messages),
    valueCurrency: z.string().refine(
      (value) => value === "" || (currencyEnums as readonly string[]).includes(value),
      { message: messages.invalidEnum },
    ),
    askingPrice: optionalNumber(messages),
    showValuePublicly: z.enum(["true", "false"], { message: messages.invalidEnum }),
    acquisitionDate: z.string().refine(
      (value) => { if (value.trim() === "") return true; const date = new Date(value); return !Number.isNaN(date.getTime()); },
      { message: messages.invalidDate },
    ),
    acquisitionSource: optionalTrimmedString(200),
  });

  return { saleFormSchema };
}
```

Then add default-English exports:

```typescript
const defaultEditSchemas = editHorseFormSchemas({
  required: "This field is required", invalidDate: "Please enter a valid date",
  invalidEnum: "Please select a valid option", invalidNumber: "Please enter a valid number",
  contactNameRequired: "Contact name is required when not using owner contact",
  contactPhoneRequired: "Contact phone is required when not using owner contact",
  contactEmailRequired: "Contact email is required when not using owner contact",
  contactEmailInvalid: "Please provide a valid email address",
});
export const editHorseFormSchema = defaultEditSchemas.editHorseFormSchema;
export type EditHorseFormValues = z.infer<typeof editHorseFormSchema>;

const defaultSaleSchemas = saleFormSchemas({
  required: "This field is required", invalidDate: "Please enter a valid date",
  invalidEnum: "Please select a valid option", invalidNumber: "Please enter a valid number",
  contactNameRequired: "Contact name is required when not using owner contact",
  contactPhoneRequired: "Contact phone is required when not using owner contact",
  contactEmailRequired: "Contact email is required when not using owner contact",
  contactEmailInvalid: "Please provide a valid email address",
});
export const saleFormSchema = defaultSaleSchemas.saleFormSchema;
export type SaleFormValues = z.infer<typeof saleFormSchema>;
```

- [ ] **Step 2: Run tests**

```bash
cd equus && npm test
```

- [ ] **Step 3: Commit**

```bash
git add equus/lib/validations/horseForms.ts
git commit -m "feat: add Zod schemas for horse edit and sale forms"
```

---

### Task 2: Create useUpdateHorse Mutation Hook

**Files:**
- Modify: `equus/hooks/queries/useHorse.ts`

**Interfaces:**
- Produces: `useUpdateHorse(options: UpdateHorseInput)` mutation hook

- [ ] **Step 1: Add update mutation function and hook**

Add after `useCreateHorse()` at the bottom of the file:

```typescript
type UpdateHorseInput = { horseId: string; patch: Record<string, unknown> };

async function updateHorseApi(input: UpdateHorseInput): Promise<void> {
  const response = await fetchWithAuth(`/api/v1/horses/${encodeURIComponent(input.horseId)}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input.patch),
  });
  await parseApiResponse<{ horse: Record<string, unknown> }>(response);
}

export function useUpdateHorse() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: updateHorseApi,
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.horses.owner(variables.horseId) });
      queryClient.invalidateQueries({ queryKey: queryKeys.horses.lists() });
    },
  });
}
```

- [ ] **Step 2: Commit**

```bash
git add equus/hooks/queries/useHorse.ts
git commit -m "feat: add useUpdateHorse mutation hook"
```

---

### Task 3: Migrate HorseEditForm to Zod + Mutation + FieldError

**Files:**
- Modify: `equus/components/horses/horse-edit-form.tsx`

**Interfaces:**
- Consumes: `editHorseFormSchema`, `EditHorseFormValues` (from Task 1), `useUpdateHorse` (from Task 2)

- [ ] **Step 1: Rewrite imports**

Replace imports to include `zodResolver`, `editHorseFormSchemas`, `horseFormMessagesFromTranslations`, `EditHorseFormValues`, and `useUpdateHorse`.

- [ ] **Step 2: Add Zod resolver to useForm**

Replace:
```typescript
const form = useForm({ defaultValues: { ... } });
```
With:
```typescript
const formMessages = useMemo(() => horseFormMessagesFromTranslations(t), [t]);
const { editHorseFormSchema } = useMemo(() => editHorseFormSchemas(formMessages), [formMessages]);
const form = useForm<EditHorseFormValues>({ resolver: zodResolver(editHorseFormSchema), defaultValues: { ... } });
```

- [ ] **Step 3: Replace bare fetch with mutation**

Add `const updateHorse = useUpdateHorse();` at the top of the component.
Replace `try { const res = await fetch(...) ... } catch` with `try { await updateHorse.mutateAsync({ horseId, patch }); ... } catch`.
Replace `isSubmitting` with `updateHorse.isPending` throughout the JSX.

- [ ] **Step 4: Commit**

```bash
git add equus/components/horses/horse-edit-form.tsx
git commit -m "feat: add Zod validation and useUpdateHorse mutation to HorseEditForm"
```

---

### Task 4: Create useUpdateHorseSale Mutation Hook

**Files:**
- Modify: `equus/hooks/queries/useHorse.ts`

**Interfaces:**
- Produces: `useUpdateHorseSale()` mutation hook

- [ ] **Step 1: Add sale mutation hook**

Add to `useHorse.ts` after `useUpdateHorse()`:

```typescript
type UpdateHorseSaleInput = { horseId: string; patch: Record<string, unknown> };

async function updateHorseSaleApi(input: UpdateHorseSaleInput): Promise<void> {
  const response = await fetchWithAuth(`/api/v1/horses/${encodeURIComponent(input.horseId)}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input.patch),
  });
  await parseApiResponse<{ horse: Record<string, unknown> }>(response);
}

export function useUpdateHorseSale() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: updateHorseSaleApi,
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.horses.owner(variables.horseId) });
      queryClient.invalidateQueries({ queryKey: queryKeys.horses.lists() });
    },
  });
}
```

- [ ] **Step 2: Commit**

```bash
git add equus/hooks/queries/useHorse.ts
git commit -m "feat: add useUpdateHorseSale mutation hook"
```

---

### Task 5: Migrate HorseSaleForm to Zod + Mutation + FieldError

**Files:**
- Modify: `equus/components/horses/horse-sale-form.tsx`

**Interfaces:**
- Consumes: `saleFormSchema`, `SaleFormValues` (from Task 1), `useUpdateHorseSale` (from Task 4)

- [ ] **Step 1: Add Zod resolver and mutation**

Same pattern as Task 3 — add `zodResolver`, inject schema via `saleFormSchemas`, add `useUpdateHorseSale` mutation, replace bare fetch with `mutateAsync`, replace `isSubmitting` with `isPending`.

- [ ] **Step 2: Commit**

```bash
git add equus/components/horses/horse-sale-form.tsx
git commit -m "feat: add Zod validation and useUpdateHorseSale mutation to HorseSaleForm"
```

---

### Task 6: Migrate CreateHorseForm to useExisting Mutation

**Files:**
- Modify: `equus/components/horses/create-horse-form.tsx`

**Interfaces:**
- Consumes: `useCreateHorse` from `equus/hooks/queries/useHorse.ts`

- [ ] **Step 1: Add useCreateHorse import and use it**

Add `import { useCreateHorse } from "@/hooks/queries/useHorse.ts";`
Add `const createHorse = useCreateHorse();` at component top.
Replace the bare fetch section with `const result = await createHorse.mutateAsync(payload);` and directly access `result.horse`.

- [ ] **Step 2: Commit**

```bash
git add equus/components/horses/create-horse-form.tsx
git commit -m "refactor: use useCreateHorse mutation instead of bare fetch in CreateHorseForm"
```

---

### Task 7: Create useUpdateProfile Mutation Hook

**Files:**
- Modify: `equus/hooks/queries/useCurrentUser.ts`

**Interfaces:**
- Produces: `useUpdateProfile()` mutation hook

- [ ] **Step 1: Add mutation hook**

Add the import for `useMutation` and `updateUserProfile`:

```typescript
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { updateUserProfile } from "@/lib/api/auth/profile";
import type { UpdatePersonalDetailsInput } from "@/lib/services/userService";
```

Add the hook:

```typescript
export function useUpdateProfile() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ input, imageFile }: { input: UpdatePersonalDetailsInput; imageFile?: File }) =>
      updateUserProfile(input, imageFile),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.users.me });
    },
  });
}
```

- [ ] **Step 2: Commit**

```bash
git add equus/hooks/queries/useCurrentUser.ts
git commit -m "feat: add useUpdateProfile mutation hook"
```

---

### Task 8: Migrate ProfileForm to useMutation

**Files:**
- Modify: `equus/components/profile/profile-form.tsx`

**Interfaces:**
- Consumes: `useUpdateProfile` (from Task 7)

- [ ] **Step 1: Add useUpdateProfile import**

Replace `import { updateUserProfile } from "@/lib/api/auth/profile";` with `import { useUpdateProfile } from "@/hooks/queries/useCurrentUser.ts";`

- [ ] **Step 2: Replace direct API call with mutation**

Add `const updateProfile = useUpdateProfile();` near the top of the component.
Replace `const { user: savedUser } = await updateUserProfile(patch, imageFile);` with `const { user: savedUser } = await updateProfile.mutateAsync({ input: patch, imageFile: imageFile ?? undefined });`

Remove the `async function` nature of the old `updateUserProfile` call — the mutation handles it.

- [ ] **Step 3: Commit**

```bash
git add equus/components/profile/profile-form.tsx
git commit -m "refactor: use useUpdateProfile mutation in ProfileForm instead of direct API call"
```
