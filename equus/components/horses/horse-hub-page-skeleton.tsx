/**
 * Loading skeleton for `/my/horses/[horseId]` — mirrors horse hub header, ownership, and provider invites.
 */

import { Skeleton } from "@/components/ui/skeleton.tsx";

function HorseHubProviderCardSkeleton() {
  return (
    <li className="rounded-lg border p-4">
      <div className="mb-3 space-y-1">
        <Skeleton className="h-5 w-28 max-w-full" />
        <Skeleton className="h-4 w-full max-w-xs" />
      </div>
      <Skeleton className="h-10 w-full rounded-md" />
    </li>
  );
}

export function HorseHubPageSkeleton() {
  return (
    <div
      className="mx-auto flex w-full max-w-3xl flex-1 flex-col gap-8 px-4 py-6 sm:py-12"
      aria-busy
      aria-hidden
    >
      <div className="space-y-2">
        <Skeleton className="h-4 w-32" />
        <Skeleton className="h-9 w-64 max-w-full" />
        <Skeleton className="h-4 w-48 max-w-full" />
      </div>

      <section className="space-y-4">
        <div className="space-y-2">
          <Skeleton className="h-7 w-40" />
          <Skeleton className="h-4 w-full max-w-md" />
        </div>

        <div className="space-y-3 rounded-lg border p-4">
          <Skeleton className="h-5 w-36 max-w-full" />
          <Skeleton className="h-4 w-full max-w-sm" />
          <div className="space-y-2">
            <Skeleton className="h-4 w-20" />
            <Skeleton className="h-10 w-full" />
          </div>
          <div className="space-y-2">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-10 w-full" />
          </div>
          <Skeleton className="h-9 w-32" />
        </div>
      </section>

      <section className="space-y-4">
        <div className="space-y-2">
          <Skeleton className="h-7 w-48 max-w-full" />
          <Skeleton className="h-4 w-full max-w-md" />
        </div>

        <div className="space-y-8">
          <div className="space-y-4">
            <div className="space-y-1">
              <Skeleton className="h-6 w-32" />
              <Skeleton className="h-4 w-64 max-w-full" />
            </div>
            <ul className="space-y-4">
              <HorseHubProviderCardSkeleton />
              <HorseHubProviderCardSkeleton />
            </ul>
          </div>
        </div>
      </section>
    </div>
  );
}
