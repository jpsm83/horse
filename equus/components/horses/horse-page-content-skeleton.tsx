import { Skeleton } from "@/components/ui/skeleton.tsx";

export function HorsePageContentSkeleton({
  suppressHydrationWarning,
}: {
  suppressHydrationWarning?: boolean;
  showSpinner?: boolean;
}) {
  return (
    <div
      className="relative w-full h-full"
      suppressHydrationWarning={suppressHydrationWarning}
    >
      <Skeleton className="inset-0 h-full w-full p-4 rounded-md"/>
    </div>
  );
}
