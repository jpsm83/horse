# Task 2 Fix Report: React Hooks Ordering Violation

## What was fixed

Moved the `useEffect` call above the `shouldRedirect` early return in `HorsePageShell` component. The original code placed the `if (shouldRedirect) { return null; }` guard before `useEffect`, violating React's Rules of Hooks — on the redirecting render, 3 hooks ran vs 4 on normal renders, and the `router.replace()` redirect never fired, leaving the user on a blank page.

## TypeScript check results

`npx tsc --noEmit --project tsconfig.json` — **83 errors found, all in generated `.next/` files** (`.next/dev/types/routes.d.ts` and `.next/dev/types/validator.ts`). These are pre-existing corrupted auto-generated route type files, unrelated to this change. Zero errors in `components/horses/horse-page-shell.tsx` or any source file.

## Fix location

- **File:** `components/horses/horse-page-shell.tsx`
- **Lines:** `useEffect` moved from lines 51-67 to lines 46-62; `shouldRedirect` check moved from lines 47-49 to lines 64-68
