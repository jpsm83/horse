### Task 1: Create `HorsePageSkeleton`

**Files:**
- Create: `components/horses/horse-page-skeleton.tsx`

- [x] **Step 1: Create `horse-page-skeleton.tsx`**

```tsx
import { Skeleton } from "@/components/ui/skeleton.tsx";

export function HorsePageSkeleton() {
  return <Skeleton className="h-[600px] w-full rounded-lg bg-green-800" />;
}
```

This mirrors the inline skeleton currently in `HorsePageShell:75`. Using a shared component ensures visual consistency between the route-level `loading.tsx` (SSR) and the shell-level loading state (client).
