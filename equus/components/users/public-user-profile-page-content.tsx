/**
 * Public user profile page — client fetch after mount (cookie auth optional).
 */

"use client";

import { useEffect, useState } from "react";
import { notFound } from "next/navigation";
import { useTranslations } from "next-intl";

import { PublicUserProfileCardView } from "@/components/users/public-user-profile-card.tsx";
import { PublicUserProfilePageSkeleton } from "@/components/users/public-user-profile-page-skeleton.tsx";
import {
  fetchPublicUserProfile,
  isApiClientError,
  type PublicUserProfileCard,
} from "@/lib/api/userClient.ts";

type PublicUserProfilePageContentProps = {
  userId: string;
};

export function PublicUserProfilePageContent({ userId }: PublicUserProfilePageContentProps) {
  const t = useTranslations("userProfile");
  const [user, setUser] = useState<PublicUserProfileCard | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isNotFound, setIsNotFound] = useState(false);
  const [fatalError, setFatalError] = useState<Error | null>(null);

  useEffect(() => {
    let cancelled = false;

    fetchPublicUserProfile(userId)
      .then((profile) => {
        if (!cancelled) setUser(profile);
      })
      .catch((error) => {
        if (cancelled) return;
        if (isApiClientError(error) && (error.statusCode === 404 || error.statusCode === 400)) {
          setIsNotFound(true);
          return;
        }
        setFatalError(error instanceof Error ? error : new Error("Failed to load user profile"));
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [userId]);

  if (isNotFound) {
    notFound();
  }

  if (fatalError) {
    throw fatalError;
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
