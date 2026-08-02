/**
 * FarrierPageContentSkeleton — body skeleton for all `/farriers/[farrierId]/*`
 * sub-pages (hub, profile) and the farriers list/create pages.
 *
 * Used by each route's `loading.tsx` (SSR streaming) and by `FarrierPageShell` /
 * hub content while auth or view data is loading. Sharing one component avoids a
 * visual swap between SSR and client hydration. Mirrors `StablePageContentSkeleton`.
 */

import { Skeleton } from "@/components/ui/skeleton.tsx";
import { Spinner } from "@/components/ui/spinner";

export function FarrierPageContentSkeleton({
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
