import { Skeleton } from "@/components/ui/skeleton";

export function FeaturedArticlesSkeleton() {
  return (
    <section className="cv-auto">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 cv-auto px-3 pb-4">
        {Array.from({ length: 6 }).map((_, index) => (
          <div key={index} className="bg-white shadow-sm overflow-hidden h-full flex flex-col">
            <Skeleton className="h-40 w-full" />
            <div className="p-3 flex-1 flex flex-col gap-3">
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-3 w-full" />
              <Skeleton className="h-3 w-2/3" />
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

