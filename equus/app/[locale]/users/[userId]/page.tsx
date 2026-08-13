import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { UserHubPublicPage } from "./client";
import { userIdParamSchema } from "@/lib/validations/user.ts";
import { generateUserMetadata } from "@/lib/seo/entity-metadata.ts";
import { fetchApiJson } from "@/lib/seo/fetchApiJson.ts";
import type { PublicUserProfileCard } from "@/lib/privacy/userPublicProfile.ts";

type UserProfilePageProps = {
  params: Promise<{ userId: string; locale: string }>;
};

export async function generateMetadata({ params }: UserProfilePageProps): Promise<Metadata> {
  const { userId, locale } = await params;
  const payload = await fetchApiJson<{ user: PublicUserProfileCard }>(
    `/api/v1/users/${encodeURIComponent(userId)}`,
  );
  const user = payload?.user;
  if (!user) {
    return { title: "User Not Found | Equus", robots: "noindex, nofollow" };
  }
  const displayName =
    [user.firstName, user.lastName].filter(Boolean).join(" ") || user.username || "User";
  return generateUserMetadata(
    { displayName, bio: user.bio, image: user.imageUrl },
    locale,
    userId,
  );
}

export default async function Page({ params }: UserProfilePageProps) {
  const { userId } = await params;
  const parsedUserId = userIdParamSchema.safeParse(userId);

  if (!parsedUserId.success) {
    notFound();
  }

  return <UserHubPublicPage userId={parsedUserId.data} />;
}
