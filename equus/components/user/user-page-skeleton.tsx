"use client";

import { Skeleton } from "@/components/ui/skeleton.tsx";

/** Shared SSR/client skeleton for `/user/[userId]/*` account pages. */
export function UserPageSkeleton({
  suppressHydrationWarning,
}: {
  suppressHydrationWarning?: boolean;
}) {
  return (
    <div
      className="mx-auto flex w-full flex-1 flex-col gap-4 p-4 sm:p-6"
      suppressHydrationWarning={suppressHydrationWarning}
    >
      <Skeleton className="h-8 w-48" />
      <Skeleton className="h-4 w-72" />
      <Skeleton className="mt-4 h-64 w-full rounded-lg" />
      <Skeleton className="h-40 w-full rounded-lg" />
    </div>
  );
}
