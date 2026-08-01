"use client";

import { notFound } from "next/navigation";
import { useTranslations } from "next-intl";

import { UserHubContent } from "@/components/user/hub/user-hub-content.tsx";
import { UserPageContentSkeleton } from "@/components/user/user-page-content-skeleton.tsx";
import { useUserHub } from "@/hooks/queries/useUser.ts";
import { isFetchError } from "@/lib/api/fetchWithAuth";

type UserHubPublicPageProps = {
  userId: string;
};

export function UserHubPublicPage({ userId }: UserHubPublicPageProps) {
  const t = useTranslations("userHub");
  const { data: sections, isLoading, error } = useUserHub(userId);

  if (isLoading) {
    return <UserPageContentSkeleton suppressHydrationWarning />;
  }

  if (error || !sections) {
    const notFoundError =
      isFetchError(error) &&
      (error.statusCode === 404 || error.statusCode === 400);
    if (notFoundError) notFound();
    return (
      <div className="mx-auto flex w-full max-w-lg flex-1 flex-col gap-3 p-6">
        <p className="text-muted-foreground">{t("loadFailed")}</p>
      </div>
    );
  }

  return <UserHubContent sections={sections} />;
}
