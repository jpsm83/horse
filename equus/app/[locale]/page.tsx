import { Suspense } from "react";

import { HomePage } from "@/components/home/home-page.tsx";
import { HomePageSkeleton } from "@/components/home/home-page-skeleton.tsx";

export default function Page() {
  return (
    <Suspense fallback={<HomePageSkeleton />}>
      <HomePage />
    </Suspense>
  );
}
