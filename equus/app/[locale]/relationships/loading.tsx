"use client";

import { useTranslations } from "next-intl";

import { AuthPageShell } from "@/components/auth/auth-page-shell.tsx";
import { InviteHubListSkeleton } from "@/components/layout/entity-placeholder-skeleton.tsx";
import { Link } from "@/i18n/navigation.ts";

export default function RelationshipsLoading() {
  const t = useTranslations("invites.relationships");
  const tCommon = useTranslations("common");

  return (
    <AuthPageShell
      title={t("title")}
      description={tCommon("loading")}
      footer={
        <Link href="/" className="font-medium text-foreground underline-offset-4 hover:underline">
          {tCommon("home")}
        </Link>
      }
    >
      <InviteHubListSkeleton />
    </AuthPageShell>
  );
}
