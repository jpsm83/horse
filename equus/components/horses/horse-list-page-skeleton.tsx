import { Skeleton } from "@/components/ui/skeleton";

function HorseCardSkeleton() {
  return (
    <div className="flex items-center gap-4 rounded-lg border p-3" aria-hidden>
      <Skeleton className="size-14 shrink-0 rounded-full" />
      <div className="flex flex-1 flex-col gap-1.5">
        <Skeleton className="h-4 w-32" />
        <Skeleton className="h-3 w-48" />
        <Skeleton className="h-3 w-24" />
      </div>
    </div>
  );
}

function FilterSkeleton() {
  return (
    <div className="flex flex-wrap items-center gap-3">
      <Skeleton className="h-4 w-28" />
      <Skeleton className="h-8 w-40 rounded-md" />
      <Skeleton className="h-8 w-32 rounded-md" />
      <Skeleton className="h-8 w-40 rounded-md" />
      <Skeleton className="h-8 w-20 rounded-md" />
      <Skeleton className="h-8 w-16 rounded-md" />
    </div>
  );
}

export function HorseListPageSkeleton() {
  return (
    <>
      <div className="sticky top-0 z-10 border-b bg-background px-4 py-2 sm:px-6">
        <div className="flex items-center justify-between gap-4">
          <FilterSkeleton />
          <Skeleton className="h-8 w-32 shrink-0 rounded-md" />
        </div>
      </div>

      <div
        className="mx-auto flex w-full max-w-3xl flex-1 flex-col gap-6 px-4 py-6 sm:py-8"
        aria-busy="true"
      >
        <div className="grid gap-3 sm:grid-cols-2">
          <HorseCardSkeleton />
          <HorseCardSkeleton />
          <HorseCardSkeleton />
          <HorseCardSkeleton />
        </div>
      </div>
    </>
  );
}
