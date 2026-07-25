"use client";

import { useTranslations } from "next-intl";
import { ErrorBoundary } from "react-error-boundary";

import { UserPageShell } from "@/components/user/user-page-shell.tsx";
import { Section } from "@/components/shared/section.tsx";
import { InlineErrorFallback } from "@/components/errors/inline-error-fallback.tsx";
import { UserRelationshipRequestsSection } from "@/components/user/relationships/user-relationship-requests-section.tsx";
import { UserRelationshipListSection } from "@/components/user/relationships/user-relationship-list-section.tsx";

type Props = { userId: string };

export function RelationshipsContent({ userId }: Props) {
  return (
    <UserPageShell userId={userId}>
      <RelationshipsBody userId={userId} />
    </UserPageShell>
  );
}

function RelationshipsBody({ userId: _userId }: Props) {
  const t = useTranslations("userRelationships");

  return (
    <div className="flex flex-col gap-6">
      <div className="space-y-2">
        <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">{t("title")}</h1>
        <p className="text-muted-foreground">{t("description")}</p>
      </div>

      <Section title={t("sections.requests")} description={t("sections.requestsDescription")}>
        <ErrorBoundary fallbackRender={(p) => <InlineErrorFallback {...p} />}>
          <UserRelationshipRequestsSection />
        </ErrorBoundary>
      </Section>

      <Section title={t("sections.active")} description={t("sections.activeDescription")}>
        <ErrorBoundary fallbackRender={(p) => <InlineErrorFallback {...p} />}>
          <UserRelationshipListSection />
        </ErrorBoundary>
      </Section>
    </div>
  );
}
