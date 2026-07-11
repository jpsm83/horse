# Business User Type Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Add a lightweight `userType` ("individual" | "business") flag to User, with optional business tax fields, and cancel the obsolete H-OWN-03 co-owner billing responsibility feature.

**Architecture:** Pure schema extension — no behavioral logic changes. Business accounts behave identically to individual accounts in all app flows. Business fields are for user tax purposes only.

**Tech Stack:** MongoDB/Mongoose, Zod, Next.js

## Global Constraints

- Business accounts have identical app behavior to individual accounts
- `isBillingResponsible` removed from co-owner schema (H-OWN-03 cancelled)
- All existing tests must pass without modification

---

### Task 1: Add userType enum and Mongoose schema

**Files:**
- Modify: `equus/utils/enums.ts`
- Modify: `equus/models/User.ts`

**Interfaces:**
- Produces: `userTypeEnums` export, `BusinessDetails` embed, `userType` + `businessDetails` on User model

- [ ] **Step 1: Add `userTypeEnums` to `utils/enums.ts`**

Add after `userDirectMessageAudienceEnums`:
```typescript
export const userTypeEnums = ["individual", "business"] as const;
```

- [ ] **Step 2: Add `userType` and `businessDetails` to `models/User.ts`**

Before `preferences` in the schema, add:
```typescript
userType: {
  type: String,
  enum: userTypeEnums,
  default: "individual",
},
businessDetails: {
  type: new Schema({
    businessName: { type: String, maxlength: 200 },
    registrationNumber: { type: String, maxlength: 100 },
    taxId: { type: String, maxlength: 100 },
    countryOfRegistration: { type: String, maxlength: 2 },
  }, { _id: false }),
  default: undefined,
},
```

Import `userTypeEnums` from `@/utils/enums.ts`.

- [ ] **Step 3: Commit**

```bash
git add equus/utils/enums.ts equus/models/User.ts
git commit -m "feat: add userType and businessDetails to User model"
```

### Task 2: Update register validation and service

**Files:**
- Modify: `equus/lib/validations/auth.ts`
- Modify: `equus/lib/services/authService.ts`
- Modify: `equus/lib/services/userService.ts`
- Modify: `equus/lib/api/auth/credentials.ts`

**Interfaces:**
- Consumes: `userTypeEnums`
- Produces: `registerSchema` with optional `userType`/`businessDetails`, `createCredentialsUser` with new params

- [ ] **Step 1: Update `registerSchema` in `lib/validations/auth.ts`**

Add after `preferredLanguage`:
```typescript
userType: z.enum(userTypeEnums).optional(),
businessDetails: z.object({
  businessName: z.string().trim().min(1).max(200).optional(),
  registrationNumber: z.string().trim().min(1).max(100).optional(),
  taxId: z.string().trim().min(1).max(100).optional(),
  countryOfRegistration: z.string().trim().length(2).optional(),
}).optional(),
```

Import `userTypeEnums` from `@/utils/enums.ts`.

- [ ] **Step 2: Update `register` in `lib/services/authService.ts`**

Pass `userType` and `businessDetails` through to `createCredentialsUser`.

- [ ] **Step 3: Update `createCredentialsUser` in `lib/services/userService.ts`**

Accept `userType` and `businessDetails` in input, pass to `User.create`.

Also update `PublicUser` type to include `userType` and `businessDetails`.

Update `toPublicUser` to include these fields.

- [ ] **Step 4: Update `registerWithCredentials` in `lib/api/auth/credentials.ts`**

Add `userType` and `businessDetails` to input type.

- [ ] **Step 5: Commit**

```bash
git add equus/lib/validations/auth.ts equus/lib/services/authService.ts equus/lib/services/userService.ts equus/lib/api/auth/credentials.ts
git commit -m "feat: support userType and businessDetails in registration"
```

### Task 3: Update profile edit validation and service

**Files:**
- Modify: `equus/lib/validations/user.ts`

- [ ] **Step 1: Add business fields to `updatePersonalDetailsSchema`**

Add to the schema object:
```typescript
userType: z.enum(userTypeEnums).optional(),
businessDetails: z.union([
  z.object({
    businessName: z.union([z.string().trim().min(1).max(200), z.literal("")]).optional(),
    registrationNumber: z.union([z.string().trim().min(1).max(100), z.literal("")]).optional(),
    taxId: z.union([z.string().trim().min(1).max(100), z.literal("")]).optional(),
    countryOfRegistration: z.union([z.string().trim().length(2), z.literal("")]).optional(),
  }),
  z.literal(""),
]).optional(),
```

Import `userTypeEnums`.

- [ ] **Step 2: Commit**

```bash
git add equus/lib/validations/user.ts
git commit -m "feat: add businessDetails to profile update schema"
```

### Task 4: Update public profile to show business name

**Files:**
- Modify: `equus/lib/privacy/userVisibility.ts`
- Modify: `equus/lib/privacy/userPublicProfile.ts`

- [ ] **Step 1: Update `PublicUserIdentity` in `userVisibility.ts`**

Add optional `businessName` field.

- [ ] **Step 2: Update `toPublicUserIdentity` in `userVisibility.ts`**

Add business name exposure (when userType is "business").

- [ ] **Step 3: Update `mapPublicUserProfileCard` in `userPublicProfile.ts`**

Use `businessName` as display name for business users (in place of firstName/lastName).

- [ ] **Step 4: Commit**

```bash
git add equus/lib/privacy/userVisibility.ts equus/lib/privacy/userPublicProfile.ts
git commit -m "feat: show businessName on public user profile for business accounts"
```

### Task 5: Remove isBillingResponsible from coOwner schema

**Files:**
- Modify: `equus/models/sharedSchemas/coOwner.ts`

- [ ] **Step 1: Remove `isBillingResponsible` field**

Delete line: `isBillingResponsible: { type: Boolean, default: false },`

- [ ] **Step 2: Commit**

```bash
git add equus/models/sharedSchemas/coOwner.ts
git commit -m "feat: remove isBillingResponsible from coOwner schema (H-OWN-03 cancelled)"
```

### Task 6: Update signup UI

**Files:**
- Modify: `equus/components/auth/sign-up-content.tsx`
- Modify: `equus/lib/validations/authForms.ts`

- [ ] **Step 1: Add userType to signUpFormSchema in `authForms.ts`**

Add to the schema:
```typescript
userType: z.enum(["individual", "business"]).optional(),
businessDetails: z.object({
  businessName: z.string().trim().min(1).max(200).optional(),
  registrationNumber: z.string().trim().min(1).max(100).optional(),
  taxId: z.string().trim().min(1).max(100).optional(),
  countryOfRegistration: z.string().trim().length(2).optional(),
}).optional(),
```

Update `SignUpFormValues` type.

- [ ] **Step 2: Add UI toggle and business fields in `sign-up-content.tsx`**

Add a radio/select for userType (Individual/Business).
When Business is selected, show optional fields for businessName, registrationNumber, taxId, countryOfRegistration.
Pass `userType` and `businessDetails` in the `registerWithCredentials` call.

- [ ] **Step 3: Commit**

```bash
git add equus/components/auth/sign-up-content.tsx equus/lib/validations/authForms.ts
git commit -m "feat: add business user type option to signup form"
```

### Task 7: Update documentation

**Files:**
- Modify: `documentation/horseModule.md`
- Modify: `documentation/userModule.md`
- Modify: `documentation/ownershipTransfer.md`
- Modify: `equus/documentation/ownershipTransfer.md`

- [ ] **Step 1: Cancel H-OWN-03 in `horseModule.md`**

Change H-OWN-03 status from "planned" to "cancelled". Add note: "Moot under user-tier billing model. Businesses register as business users instead."

- [ ] **Step 2: Remove `isBillingResponsible` from docs**

Remove from `userModule.md` line 166 and both `ownershipTransfer.md` files.

- [ ] **Step 3: Add user types section to `userModule.md`**

Add section 11 for user types describing `individual` vs `business`.

- [ ] **Step 4: Commit**

```bash
git add documentation/horseModule.md documentation/userModule.md documentation/ownershipTransfer.md equus/documentation/ownershipTransfer.md
git commit -m "docs: update for business user type and cancel H-OWN-03"
```

### Task 8: Run tests and verify

- [ ] **Step 1: Run tests**

```bash
cd equus && npm test
```

- [ ] **Step 2: Fix any failures**

- [ ] **Step 3: Final commit if fixes needed**
