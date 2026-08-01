/**
 * UserHubContent — shared read-only user hub, following the horse hub structure.
 *
 * Used by the owner account hub tab (/user/[userId], from the cached
 * `user.sections`) and the public profile page (/users/[userId], from
 * `GET …/hub`). Renders only the server-filtered `sections` present — no
 * visibility popovers on the hub.
 */

"use client";

import { useTranslations } from "next-intl";

import { SectionErrorBoundary } from "@/components/errors/section-error-boundary.tsx";
import { Section } from "@/components/shared/section.tsx";
import { UserHubHero } from "@/components/user/hub/user-hub-hero.tsx";
import { UserHubIdentification } from "@/components/user/hub/user-hub-identification.tsx";
import { UserHubAddress } from "@/components/user/hub/user-hub-address.tsx";
import { UserHubContact } from "@/components/user/hub/user-hub-contact.tsx";
import { UserHubEntities } from "@/components/user/hub/user-hub-entities.tsx";
import type { UserHubSectionsProjection } from "@/lib/users/userHubSections.ts";

type UserHubContentProps = {
  sections: UserHubSectionsProjection;
};

export function UserHubContent({ sections }: UserHubContentProps) {
  const t = useTranslations("userHub");
  const { identity, identification, address, contact, entities } = sections;

  return (
    <div className="flex w-full flex-1 flex-col gap-4" suppressHydrationWarning>
      {identity ? (
        <SectionErrorBoundary>
          <UserHubHero identity={identity} />
        </SectionErrorBoundary>
      ) : null}

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2 lg:items-stretch">
        <div className="flex min-w-0 flex-col gap-4">
          {identification ? (
            <Section title={t("sections.identification")}>
              <SectionErrorBoundary>
                <UserHubIdentification identification={identification} />
              </SectionErrorBoundary>
            </Section>
          ) : null}
          {address ? (
            <Section title={t("sections.address")}>
              <SectionErrorBoundary>
                <UserHubAddress address={address} />
              </SectionErrorBoundary>
            </Section>
          ) : null}
          {contact ? (
            <Section title={t("sections.contact")}>
              <SectionErrorBoundary>
                <UserHubContact contact={contact} />
              </SectionErrorBoundary>
            </Section>
          ) : null}
        </div>

        {entities ? (
          <div className="flex min-w-0 flex-col">
            <Section title={t("sections.entities")}>
              <SectionErrorBoundary>
                <UserHubEntities entities={entities.entities} />
              </SectionErrorBoundary>
            </Section>
          </div>
        ) : null}
      </div>
    </div>
  );
}
