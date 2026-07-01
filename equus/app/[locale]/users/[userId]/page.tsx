import { notFound } from "next/navigation";
import { Suspense } from "react";

import { PublicUserProfilePage } from "@/components/users/public-user-profile-page.tsx";
import { PublicUserProfilePageSkeleton } from "@/components/users/public-user-profile-page-skeleton.tsx";
import { userIdParamSchema } from "@/lib/validations/user.ts";

type UserProfilePageProps = {
  params: Promise<{ userId: string }>;
};

export default async function Page({ params }: UserProfilePageProps) {
  const { userId } = await params;
  const parsedUserId = userIdParamSchema.safeParse(userId);

  if (!parsedUserId.success) {
    notFound();
  }

  return (
    <Suspense fallback={<PublicUserProfilePageSkeleton />}>
      <PublicUserProfilePage userId={parsedUserId.data} />
    </Suspense>
  );
}
