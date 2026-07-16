import { Skeleton } from "@/components/ui/skeleton.tsx";

export function HorsePageSkeleton({ suppressHydrationWarning }: { suppressHydrationWarning?: boolean }) {
  return <Skeleton className="h-[600px] w-full rounded-lg bg-green-800" suppressHydrationWarning={suppressHydrationWarning} />;
}
