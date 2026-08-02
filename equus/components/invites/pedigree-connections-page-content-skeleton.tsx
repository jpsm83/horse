/**
 * PedigreeConnectionsPageContentSkeleton — body skeleton for the pedigree
 * connections inbox page (`/pedigree-connections`). Used by `loading.tsx` (SSR)
 * and inline loading states in `PedigreeConnectionsContent`. Sharing one
 * component avoids a visual swap between SSR and client hydration.
 */

import { Skeleton } from "@/components/ui/skeleton.tsx";
import { Spinner } from "@/components/ui/spinner";

export function PedigreeConnectionsPageContentSkeleton({
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
