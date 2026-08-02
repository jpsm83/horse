/**
 * TransportHubContent — public transport hub assembly (`/transport/[transportId]`).
 *
 * Reads the pre-seeded transport view from the TanStack cache (layout RSC) and
 * renders the hero, about, and contact sections, each wrapped in
 * `SectionErrorBoundary`.
 */

"use client";

import { useTranslations } from "next-intl";

import { SectionErrorBoundary } from "@/components/errors/section-error-boundary.tsx";
import { TransportPageContentSkeleton } from "@/components/transport/transport-page-content-skeleton.tsx";
import { TransportHubAbout } from "@/components/transport/hub/transport-hub-about.tsx";
import { TransportHubContact } from "@/components/transport/hub/transport-hub-contact.tsx";
import { TransportHubHero } from "@/components/transport/hub/transport-hub-hero.tsx";
import { Section } from "@/components/shared/section.tsx";
import { useTransportView } from "@/hooks/queries/useTransport.ts";
import { Link } from "@/i18n/navigation.ts";

type TransportHubContentProps = {
  transportId: string;
};

export function TransportHubContent({ transportId }: TransportHubContentProps) {
  const t = useTranslations("transport.hub");
  const { data: view, isLoading, error } = useTransportView(transportId);

  if (isLoading) {
    return <TransportPageContentSkeleton suppressHydrationWarning />;
  }

  if (error || !view?.transport) {
    return (
      <div className="mx-auto flex w-full max-w-lg flex-1 flex-col gap-3">
        <p className="text-muted-foreground">{t("loadFailed")}</p>
        <Link
          href="/transport"
          className="text-sm font-medium text-primary underline underline-offset-4 hover:text-foreground"
        >
          {t("backToTransport")}
        </Link>
      </div>
    );
  }

  const transport = view.transport;

  return (
    <div className="flex w-full flex-1 flex-col gap-4" suppressHydrationWarning>
      <SectionErrorBoundary message={t("loadFailed")}>
        <TransportHubHero transport={transport} />
      </SectionErrorBoundary>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2 lg:items-stretch">
        <Section title={t("about")}>
          <SectionErrorBoundary message={t("loadFailed")}>
            <TransportHubAbout transport={transport} />
          </SectionErrorBoundary>
        </Section>

        <Section title={t("contact")}>
          <SectionErrorBoundary message={t("loadFailed")}>
            <TransportHubContact transport={transport} />
          </SectionErrorBoundary>
        </Section>
      </div>
    </div>
  );
}
