import { Suspense } from "react";

import { HorseHubPageContent } from "@/components/horses/horse-hub-page-content.tsx";
import { HorseHubPageSkeleton } from "@/components/horses/horse-hub-page-skeleton.tsx";

type HorseHubPageProps = {
  params: Promise<{ horseId: string }>;
};

export default async function HorseHubPage({ params }: HorseHubPageProps) {
  const { horseId } = await params;

  return (
    <Suspense fallback={<HorseHubPageSkeleton />}>
      <HorseHubPageContent horseId={horseId} />
    </Suspense>
  );
}
