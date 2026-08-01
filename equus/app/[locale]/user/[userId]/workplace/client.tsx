"use client";

import { useTranslations } from "next-intl";

import { UserPageShell } from "@/components/user/user-page-shell.tsx";
import { Section } from "@/components/shared/section.tsx";
import { SectionErrorBoundary } from "@/components/errors/section-error-boundary.tsx";
import { UserWorkplaceInvitationsSection } from "@/components/user/workplace/user-workplace-invitations-section.tsx";
import { UserWorkplaceListSection } from "@/components/user/workplace/user-workplace-list-section.tsx";

type Props = { userId: string };

export function WorkplaceContent({ userId }: Props) {
  return (
    <UserPageShell userId={userId}>
      <WorkplaceBody userId={userId} />
    </UserPageShell>
  );
}

function WorkplaceBody({ userId: _userId }: Props) {
  const t = useTranslations("userWorkplace");

  return (
    <div className="flex flex-col gap-6">
      <div className="space-y-2">
        <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">{t("title")}</h1>
        <p className="text-muted-foreground">{t("description")}</p>
      </div>

      <Section title={t("sections.invitations")} description={t("sections.invitationsDescription")}>
        <SectionErrorBoundary>
          <UserWorkplaceInvitationsSection />
        </SectionErrorBoundary>
      </Section>

      <Section title={t("sections.active")} description={t("sections.activeDescription")}>
        <SectionErrorBoundary>
          <UserWorkplaceListSection />
        </SectionErrorBoundary>
      </Section>
    </div>
  );
}
