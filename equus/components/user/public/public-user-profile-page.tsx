"use client";

import { PublicUserProfilePageContent } from "@/components/user/public/public-user-profile-page-content.tsx";

type PublicUserProfilePageProps = {
  userId: string;
};

export function PublicUserProfilePage({ userId }: PublicUserProfilePageProps) {
  return <PublicUserProfilePageContent userId={userId} />;
}
