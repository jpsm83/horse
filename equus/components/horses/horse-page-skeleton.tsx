import { Skeleton } from "@/components/ui/skeleton.tsx";

export function HorsePageSkeleton({ suppressHydrationWarning }: { suppressHydrationWarning?: boolean }) {
  return <Skeleton className="h-full w-full rounded-lg" suppressHydrationWarning={suppressHydrationWarning} />;
}
