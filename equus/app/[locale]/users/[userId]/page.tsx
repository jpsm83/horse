import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Suspense } from "react";

import { PublicUserProfilePage } from "@/components/users/public-user-profile-page.tsx";
import { PublicUserProfilePageSkeleton } from "@/components/users/public-user-profile-page-skeleton.tsx";
import { userIdParamSchema } from "@/lib/validations/user.ts";
import { generateUserMetadata } from "@/lib/seo/entity-metadata.ts";
import User from "@/models/User.ts";

type UserProfilePageProps = {
  params: Promise<{ userId: string; locale: string }>;
};

export async function generateMetadata({ params }: UserProfilePageProps): Promise<Metadata> {
  const { userId, locale } = await params;
  try {
    const user = await User.findById(userId).select("personalDetails").lean();
    if (!user) return { title: "User Not Found | Equus", robots: "noindex, nofollow" };
    const pd = user.personalDetails;
    const displayName = [pd?.firstName, pd?.lastName].filter(Boolean).join(" ") || "User";
    return generateUserMetadata({
      displayName,
      bio: pd?.bio,
      image: pd?.imageUrl,
    }, locale, userId);
  } catch {
    return { title: "User Not Found | Equus", robots: "noindex, nofollow" };
  }
}

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
