/**
 * Public user profile page — TanStack Query fetch after mount (cookie auth optional).
 */

"use client";

import { notFound } from "next/navigation";
import { useTranslations } from "next-intl";

import { PublicUserProfileCardView } from "@/components/users/public-user-profile-card.tsx";
import { PublicUserProfilePageSkeleton } from "@/components/users/public-user-profile-page-skeleton.tsx";
import { usePublicUser } from "@/hooks/queries/useUser.ts";
import { isFetchError } from "@/lib/api/fetchWithAuth";

type PublicUserProfilePageContentProps = {
  userId: string;
};

export function PublicUserProfilePageContent({ userId }: PublicUserProfilePageContentProps) {
  const t = useTranslations("userProfile");
  const { data: user, isLoading, error } = usePublicUser(userId);

  if (error) {
    if (isFetchError(error) && (error.statusCode === 404 || error.statusCode === 400)) {
      notFound();
    }
    throw error instanceof Error ? error : new Error("Failed to load user profile");
  }

  if (isLoading || !user) {
    return <PublicUserProfilePageSkeleton />;
  }

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-1 flex-col gap-6 px-4 py-6 sm:gap-8 sm:py-12">
      <div className="space-y-2">
        <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">{t("title")}</h1>
        <p className="max-w-2xl text-sm text-muted-foreground sm:text-base">{t("description")}</p>
      </div>

      <PublicUserProfileCardView user={user} />
    </div>
  );
}
