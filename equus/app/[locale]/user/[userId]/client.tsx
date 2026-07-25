"use client";

import { useTranslations } from "next-intl";
import { ErrorBoundary } from "react-error-boundary";
import { Info } from "lucide-react";

import { UserPageShell } from "@/components/user/user-page-shell.tsx";
import { Section } from "@/components/shared/section.tsx";
import { InlineErrorFallback } from "@/components/errors/inline-error-fallback.tsx";
import { UserHubVisibilitySection } from "@/components/user/hub/user-hub-visibility-section.tsx";
import { UserHubHero } from "@/components/user/hub/user-hub-hero.tsx";
import { UserHubAbout } from "@/components/user/hub/user-hub-about.tsx";
import { UserHubEntities } from "@/components/user/hub/user-hub-entities.tsx";
import { UserHubContact } from "@/components/user/hub/user-hub-contact.tsx";
import { UserSectionVisibility } from "@/components/user/shared/user-section-visibility.tsx";
import { useUserView } from "@/hooks/queries/useCurrentUser.ts";
import { normalizeUserHubSections } from "@/lib/users/userHubSections.ts";

type Props = { userId: string };

export function HubContent({ userId }: Props) {
  return (
    <UserPageShell userId={userId}>
      <HubBody userId={userId} />
    </UserPageShell>
  );
}

function HubBody({ userId }: Props) {
  const t = useTranslations("userHub");
  const { data: view } = useUserView(userId);
  const user = view?.user;
  const hubSections = normalizeUserHubSections(user?.hubSections);
  const profileVisibility = user?.preferences?.profileVisibility ?? "public";

  if (!user) return null;

  return (
    <div className="flex flex-col gap-6">
      {/* Preview callout */}
      <div className="flex items-start gap-3 rounded-lg border bg-muted/40 px-4 py-3">
        <Info className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
        <p className="text-sm text-muted-foreground">{t("previewCallout")}</p>
      </div>

      {/* Global visibility overview */}
      <Section
        title={t("visibilitySection.title")}
        description={t("visibilitySection.description")}
      >
        <ErrorBoundary fallbackRender={(p) => <InlineErrorFallback {...p} />}>
          <UserHubVisibilitySection
            userId={userId}
            profileVisibility={profileVisibility}
            hubSections={hubSections}
          />
        </ErrorBoundary>
      </Section>

      {/* Identity / Hero */}
      <Section
        title={t("sections.identity")}
        visibilityControl={
          <UserSectionVisibility
            userId={userId}
            sectionKey="identity"
            mode={hubSections.identity.mode}
          />
        }
      >
        <ErrorBoundary fallbackRender={(p) => <InlineErrorFallback {...p} />}>
          <UserHubHero user={user} />
        </ErrorBoundary>
      </Section>

      {/* About */}
      <Section
        title={t("sections.about")}
        visibilityControl={
          <UserSectionVisibility
            userId={userId}
            sectionKey="about"
            mode={hubSections.about.mode}
          />
        }
      >
        <ErrorBoundary fallbackRender={(p) => <InlineErrorFallback {...p} />}>
          <UserHubAbout user={user} />
        </ErrorBoundary>
      </Section>

      {/* Entities */}
      <Section
        title={t("sections.entities")}
        visibilityControl={
          <UserSectionVisibility
            userId={userId}
            sectionKey="entities"
            mode={hubSections.entities.mode}
          />
        }
      >
        <ErrorBoundary fallbackRender={(p) => <InlineErrorFallback {...p} />}>
          <UserHubEntities userId={userId} />
        </ErrorBoundary>
      </Section>

      {/* Contact */}
      <Section
        title={t("sections.contact")}
        visibilityControl={
          <UserSectionVisibility
            userId={userId}
            sectionKey="contact"
            mode={hubSections.contact.mode}
          />
        }
      >
        <ErrorBoundary fallbackRender={(p) => <InlineErrorFallback {...p} />}>
          <UserHubContact user={user} />
        </ErrorBoundary>
      </Section>
    </div>
  );
}
