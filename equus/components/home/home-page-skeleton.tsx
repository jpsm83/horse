/**
 * Loading skeleton for the signed-in home hub — mirrors welcome hero, add-horse card, and profile grid.
 */

import { Skeleton } from "@/components/ui/skeleton";

export function HomePageSkeleton() {
  return (
    <div
      className="mx-auto flex w-full max-w-2xl flex-1 flex-col gap-8 px-4 py-8 sm:gap-10 sm:py-12"
      aria-busy
      aria-hidden
    >
      <div className="space-y-4 rounded-2xl border bg-card p-6 shadow-sm">
        <div className="flex items-center gap-4">
          <Skeleton className="size-14 shrink-0 rounded-full" />
          <div className="min-w-0 flex-1 space-y-2">
            <Skeleton className="h-3 w-16" />
            <Skeleton className="h-8 w-56 max-w-full" />
            <Skeleton className="h-4 w-full max-w-sm" />
          </div>
        </div>
      </div>

      <Skeleton className="h-32 w-full rounded-2xl" />

      <div className="space-y-4">
        <div className="space-y-2">
          <Skeleton className="h-6 w-36" />
          <Skeleton className="h-4 w-64 max-w-full" />
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          <Skeleton className="h-[4.75rem] w-full rounded-xl" />
          <Skeleton className="h-[4.75rem] w-full rounded-xl" />
          <Skeleton className="h-[4.75rem] w-full rounded-xl" />
        </div>
      </div>
    </div>
  );
}
