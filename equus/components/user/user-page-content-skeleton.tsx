/**
 * UserPageContentSkeleton — body skeleton for all `/user/[userId]` sub-pages
 * (hub, profile, preferences, notifications, workplace, relationships)
 *
 * Used by each route's `loading.tsx` (SSR streaming) and by `UserPageShell` /
 * hub content while auth or view data is loading. Sharing one component means
 * there is no visual swap when SSR transitions to client hydration. Mirrors
 * `HorsePageContentSkeleton`.
 */

import { Skeleton } from "@/components/ui/skeleton.tsx";
import { Spinner } from "@/components/ui/spinner.tsx";
export function UserPageContentSkeleton({
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
