import { Suspense } from "react";

import { ProfilePage } from "@/components/profile/profile-page.tsx";
import { ProfilePageSkeleton } from "@/components/profile/profile-page-skeleton.tsx";

export default function Page() {
  return (
    <Suspense fallback={<ProfilePageSkeleton />}>
      <ProfilePage />
    </Suspense>
  );
}
