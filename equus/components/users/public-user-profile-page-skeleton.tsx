/**
 * Skeleton for `/users/[userId]` — mirrors page header and public user profile card layout.
 */

import { Skeleton } from "@/components/ui/skeleton.tsx";

export function PublicUserProfilePageSkeleton() {
  return (
    <div
      className="mx-auto flex w-full  flex-1 flex-col gap-6 px-4 py-6 sm:gap-8 sm:py-12"
      aria-busy="true"
      aria-hidden
    >
      <div className="space-y-2">
        <Skeleton className="h-8 w-48 sm:h-9" />
        <Skeleton className="h-4 w-full max-w-md" />
      </div>

      <div className="overflow-hidden rounded-xl border bg-card shadow-sm">
        <div className="border-b px-6 py-6">
          <div className="flex flex-col gap-6 sm:flex-row sm:items-start sm:gap-8">
            <Skeleton className="size-24 shrink-0 rounded-full sm:size-28" />
            <div className="min-w-0 flex-1 space-y-2">
              <Skeleton className="h-3 w-20" />
              <Skeleton className="h-8 w-56 max-w-full sm:h-9" />
              <Skeleton className="h-4 w-28" />
            </div>
          </div>
        </div>

        <div className="space-y-6 px-6 pt-6 pb-6">
          <section className="space-y-2">
            <Skeleton className="h-4 w-16" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-4/5" />
          </section>

          <section className="space-y-3">
            <Skeleton className="h-4 w-20" />
            <Skeleton className="h-4 w-48 max-w-full" />
            <Skeleton className="h-4 w-40 max-w-full" />
          </section>
        </div>
      </div>
    </div>
  );
}
