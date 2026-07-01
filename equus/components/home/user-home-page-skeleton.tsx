/**
 * Loading skeleton for the signed-in user home (`/home`) — mirrors welcome hero with avatar,
 * add-horse card, and owned subsection grid.
 */

import { Skeleton } from "@/components/ui/skeleton";

export function UserHomePageSkeleton() {
  return (
    <div
      className="mx-auto flex w-full max-w-2xl flex-1 flex-col gap-8 px-4 py-8 sm:gap-10 sm:py-12"
      aria-busy
      aria-hidden
    >
      <div className="space-y-4 rounded-2xl border bg-card px-6 py-8 shadow-sm">
        <div className="flex items-start gap-4 sm:items-center">
          <Skeleton className="size-14 shrink-0 rounded-full" />
          <div className="min-w-0 flex-1 space-y-2">
            <Skeleton className="h-3 w-16" />
            <Skeleton className="h-8 w-56 max-w-full" />
            <Skeleton className="h-4 w-full max-w-sm" />
          </div>
        </div>
      </div>

      <div className="rounded-2xl border p-5 shadow-sm sm:p-6">
        <div className="flex items-center gap-4 sm:gap-5">
          <Skeleton className="size-18 shrink-0 rounded-2xl sm:size-20" />
          <div className="min-w-0 flex-1 space-y-2">
            <Skeleton className="h-3 w-24" />
            <Skeleton className="h-6 w-40 max-w-full" />
            <Skeleton className="h-4 w-full max-w-sm" />
          </div>
          <Skeleton className="size-5 shrink-0 rounded-sm" />
        </div>
      </div>

      <div className="space-y-4">
        <div className="space-y-2">
          <Skeleton className="h-6 w-36" />
          <Skeleton className="h-4 w-64 max-w-full" />
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="flex items-center gap-3 rounded-xl border p-4">
            <Skeleton className="size-11 shrink-0 rounded-xl" />
            <Skeleton className="h-5 flex-1 max-w-[8rem]" />
            <Skeleton className="size-4 shrink-0 rounded-sm" />
          </div>
          <div className="flex items-center gap-3 rounded-xl border p-4">
            <Skeleton className="size-11 shrink-0 rounded-xl" />
            <Skeleton className="h-5 flex-1 max-w-[8rem]" />
            <Skeleton className="size-4 shrink-0 rounded-sm" />
          </div>
          <div className="flex items-center gap-3 rounded-xl border p-4">
            <Skeleton className="size-11 shrink-0 rounded-xl" />
            <Skeleton className="h-5 flex-1 max-w-[8rem]" />
            <Skeleton className="size-4 shrink-0 rounded-sm" />
          </div>
        </div>
      </div>
    </div>
  );
}
