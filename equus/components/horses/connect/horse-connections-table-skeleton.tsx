import { Skeleton } from "@/components/ui/skeleton.tsx";
import { Spinner } from "@/components/ui/spinner.tsx";

export function HorseConnectionsTableSkeleton({
  showSpinner = true,
}: {
  showSpinner?: boolean;
}) {
  return (
    <div className="relative w-full h-full">
      {showSpinner && (
        <div className="absolute inset-0 z-10 flex items-center justify-center">
          <Spinner className="size-6" />
        </div>
      )}
      <Skeleton className="inset-0 h-full w-full p-4 rounded-md" />
    </div>
  );
}
