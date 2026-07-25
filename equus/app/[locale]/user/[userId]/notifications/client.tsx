"use client";

import { useTranslations } from "next-intl";
import { ErrorBoundary } from "react-error-boundary";

import { UserPageShell } from "@/components/user/user-page-shell.tsx";
import { Section } from "@/components/shared/section.tsx";
import { InlineErrorFallback } from "@/components/errors/inline-error-fallback.tsx";
import { UserNotificationEmailSection } from "@/components/user/notifications/user-notification-email-section.tsx";

type Props = { userId: string };

export function NotificationsContent({ userId }: Props) {
  return (
    <UserPageShell userId={userId}>
      <NotificationsBody userId={userId} />
    </UserPageShell>
  );
}

function NotificationsBody({ userId }: Props) {
  const t = useTranslations("userNotifications");

  return (
    <div className="flex flex-col gap-6">
      <div className="space-y-2">
        <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">{t("title")}</h1>
        <p className="text-muted-foreground">{t("description")}</p>
      </div>

      <Section title={t("sections.email")} description={t("sections.emailDescription")}>
        <ErrorBoundary fallbackRender={(p) => <InlineErrorFallback {...p} />}>
          <UserNotificationEmailSection userId={userId} />
        </ErrorBoundary>
      </Section>
    </div>
  );
}
