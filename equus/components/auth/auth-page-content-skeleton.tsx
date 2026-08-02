/**
 * AuthPageContentSkeleton — body skeleton for all auth page loading states.
 *
 * Used by every auth route's `loading.tsx` (SSR streaming) and by `client.tsx`
 * wrappers where search-param hydration or session clearing requires a brief
 * loading state. Sharing one component means there is no visual swap between
 * SSR and client hydration. Mirrors `HorsePageContentSkeleton`.
 */

import { Skeleton } from "@/components/ui/skeleton.tsx";
import { Spinner } from "@/components/ui/spinner";

export function AuthPageContentSkeleton({
  suppressHydrationWarning,
  showSpinner = true,
}: {
  suppressHydrationWarning?: boolean;
  showSpinner?: boolean;
}) {
  return (
    <div
      className="relative w-full h-full"
      suppressHydrationWarning={suppressHydrationWarning}
    >
      {showSpinner && (
        <div className="absolute inset-0 z-10 flex items-center justify-center">
          <Spinner className="size-6" />
        </div>
      )}
      <Skeleton className="inset-0 h-full w-full p-4 rounded-md" />
    </div>
  );
}
