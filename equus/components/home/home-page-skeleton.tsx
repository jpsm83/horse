/**
 * Loading skeleton for the guest landing (`/`) — mirrors welcome hero and get-started panel.
 */

import { Skeleton } from "@/components/ui/skeleton";

export function HomePageSkeleton() {
  return (
    <div
      className="mx-auto flex w-full max-w-2xl flex-1 flex-col gap-8 px-4 py-8 sm:gap-10 sm:py-12"
      aria-busy
      aria-hidden
    >
      <div className="space-y-4 rounded-2xl border bg-card px-6 py-8 shadow-sm">
        <div className="space-y-2">
          <Skeleton className="h-3 w-16" />
          <Skeleton className="h-8 w-56 max-w-full" />
          <Skeleton className="h-4 w-full max-w-sm" />
        </div>
      </div>

      <div className="overflow-hidden rounded-2xl border bg-card shadow-sm">
        <div className="border-b px-6 py-5">
          <div className="flex items-center gap-3">
            <Skeleton className="size-11 shrink-0 rounded-xl" />
            <div className="min-w-0 flex-1 space-y-2">
              <Skeleton className="h-5 w-40 max-w-full" />
              <Skeleton className="h-4 w-64 max-w-full" />
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-3 px-6 py-5 sm:flex-row">
          <Skeleton className="h-11 w-full rounded-md sm:flex-1" />
          <Skeleton className="h-11 w-full rounded-md sm:flex-1" />
        </div>
      </div>
    </div>
  );
}
