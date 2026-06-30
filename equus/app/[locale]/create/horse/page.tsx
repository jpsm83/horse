import { Suspense } from "react";

import { CreateHorsePage } from "@/components/horses/create-horse-page.tsx";
import { CreateHorsePageSkeleton } from "@/components/horses/create-horse-page-skeleton.tsx";

export default function Page() {
  return (
    <Suspense fallback={<CreateHorsePageSkeleton />}>
      <CreateHorsePage />
    </Suspense>
  );
}
