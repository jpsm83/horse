"use client";

import { Skeleton } from "@/components/ui/skeleton.tsx";
import { HorseOwnershipHub } from "@/components/horses/horse-ownership-hub.tsx";
import { useOwnerHorse, useHorseOwnershipTransfers } from "@/hooks/queries/useHorse.ts";

type OwnershipHubSectionProps = {
  horseId: string;
};

export function OwnershipHubSection({ horseId }: OwnershipHubSectionProps) {
  const { data: horse, isPending: isHorsePending } = useOwnerHorse(horseId);
  const { data: pendingTransfers = [], isPending: isTransfersPending } = useHorseOwnershipTransfers(
    horse?.isMainOwner ? horseId : undefined,
  );

  if (isHorsePending || !horse) {
    return <Skeleton className="h-48 w-full rounded-lg" />;
  }

  if (!horse.isMainOwner) {
    return null;
  }

  if (isTransfersPending) {
    return <Skeleton className="h-48 w-full rounded-lg" />;
  }

  return (
    <HorseOwnershipHub
      horseId={horseId}
      horse={horse}
      pendingTransfers={pendingTransfers}
    />
  );
}
