import { Skeleton } from "@/components/ui/skeleton";

export function CategoryCarouselSkeleton() {
  return (
    <div className="relative sm:px-6 md:px-12 cv-auto">
      {/* Carousel Skeleton */}
      <div className="flex gap-4 overflow-hidden pb-4">
        {Array.from({ length: 5 }).map((_, index) => (
          <div key={index} className="shrink-0 basis-64">
            <div className="bg-white shadow-sm overflow-hidden flex flex-col min-h-[280px]">
              <Skeleton className="h-40 w-full" />
              <div className="p-3 flex-1 flex flex-col gap-3">
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-3 w-full" />
                <Skeleton className="h-3 w-2/3" />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
