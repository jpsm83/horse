"use client";

import { useTranslations } from "next-intl";
import { ErrorBoundary } from "react-error-boundary";

import { UserPageShell } from "@/components/user/user-page-shell.tsx";
import { Section } from "@/components/shared/section.tsx";
import { InlineErrorFallback } from "@/components/errors/inline-error-fallback.tsx";
import { UserSubscriptionPlanSection } from "@/components/user/subscription/user-subscription-plan-section.tsx";

type Props = { userId: string };

export function SubscriptionContent({ userId }: Props) {
  return (
    <UserPageShell userId={userId}>
      <SubscriptionBody userId={userId} />
    </UserPageShell>
  );
}

function SubscriptionBody({ userId }: Props) {
  const t = useTranslations("userSubscription");

  return (
    <div className="flex flex-col gap-6">
      <div className="space-y-2">
        <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">{t("title")}</h1>
        <p className="text-muted-foreground">{t("description")}</p>
      </div>

      <Section title={t("sections.plan")}>
        <ErrorBoundary fallbackRender={(p) => <InlineErrorFallback {...p} />}>
          <UserSubscriptionPlanSection userId={userId} />
        </ErrorBoundary>
      </Section>
    </div>
  );
}
