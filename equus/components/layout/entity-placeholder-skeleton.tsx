/**
 * Loading skeletons for placeholder and invite-hub pages.
 * Used during route segment load and client auth check.
 */

import { Skeleton } from "@/components/ui/skeleton";

export function EntityPlaceholderSkeleton() {
  return (
    <div
      className="mx-auto flex w-full max-w-3xl flex-1 flex-col gap-4 px-4 py-12"
      aria-busy
      aria-hidden
    >
      <Skeleton className="h-9 w-48" />
      <Skeleton className="h-5 w-full max-w-md" />
      <Skeleton className="h-4 w-32" />
    </div>
  );
}

/** Mirrors invite list cards inside AuthPageShell (/workplaces, /relationships). */
export function InviteHubListSkeleton() {
  return (
    <ul className="space-y-3" aria-busy aria-hidden>
      <li className="space-y-2 rounded-lg border p-4">
        <Skeleton className="h-5 w-40" />
        <Skeleton className="h-4 w-56" />
        <div className="flex gap-2 pt-1">
          <Skeleton className="h-8 w-16" />
          <Skeleton className="h-8 w-16" />
        </div>
      </li>
      <li className="space-y-2 rounded-lg border p-4">
        <Skeleton className="h-5 w-36" />
        <Skeleton className="h-4 w-48" />
      </li>
    </ul>
  );
}
