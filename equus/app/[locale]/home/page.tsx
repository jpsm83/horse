import { Suspense } from "react";

import { UserHomePageSkeleton } from "@/components/home/user-home-page-skeleton.tsx";
import { UserHomePage } from "@/components/home/user-home-page.tsx";

export default function Page() {
  return (
    <Suspense fallback={<UserHomePageSkeleton />}>
      <UserHomePage />
    </Suspense>
  );
}
