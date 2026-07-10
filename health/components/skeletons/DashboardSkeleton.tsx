import { Skeleton } from "@/components/ui/skeleton";

export function DashboardSkeleton() {
  return (
    <div className="space-y-2 m-2 md:m-4">
      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-2 mb-2">
        {Array.from({ length: 4 }).map((_, index) => (
          <div
            key={index}
            className="bg-white shadow-md p-2 flex flex-col items-center justify-center"
          >
            <Skeleton className="w-6 h-6 mb-1 rounded" />
            <Skeleton className="h-3 w-16 mb-0.5" />
            <Skeleton className="h-6 w-12" />
          </div>
        ))}
      </div>

      {/* Table */}
      <div className="bg-white shadow-md p-4">
        {/* Filter Controls */}
        <div className="flex gap-4 py-2 mb-4">
          <Skeleton className="h-10 w-full sm:max-w-sm" />
          <Skeleton className="h-10 w-32" />
        </div>

        {/* Table */}
        <div className="hidden md:block">
          <Skeleton className="h-96 w-full" />
        </div>

        {/* Mobile Cards */}
        <div className="md:hidden space-y-3">
          {Array.from({ length: 5 }).map((_, index) => (
            <Skeleton key={index} className="h-20 w-full" />
          ))}
        </div>

        {/* Pagination */}
        <div className="flex flex-col sm:flex-row justify-between items-center gap-4 py-4">
          <Skeleton className="h-4 w-32" />
          <div className="flex gap-2">
            <Skeleton className="h-8 w-20" />
            <Skeleton className="h-8 w-16" />
          </div>
          <Skeleton className="h-10 w-40" />
        </div>
      </div>
    </div>
  );
}

