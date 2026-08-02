/**
 * HomePageContentSkeleton — body skeleton for the guest landing (`/`) and
 * signed-in home (`/home`) pages.
 *
 * Used by both routes' `loading.tsx` (SSR streaming) and by the page content
 * components (`client.tsx`) while auth or data is loading. Sharing one component
 * means there is no visual swap when SSR transitions to client hydration.
 * Mirrors `HorsePageContentSkeleton`.
 */

import { Skeleton } from "@/components/ui/skeleton.tsx";
import { Spinner } from "@/components/ui/spinner";

export function HomePageContentSkeleton({
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
