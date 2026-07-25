/**
 * UserHubVisibilitySection — global visibility overview for the user hub tab.
 *
 * Shows Layer-1 profile visibility badge and lists all four Layer-2 hub sections
 * with their current mode and an inline popover to change each.
 */

"use client";

import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation.ts";
import { Badge } from "@/components/ui/badge.tsx";
import { UserSectionVisibility } from "@/components/user/shared/user-section-visibility.tsx";
import type { UserHubSections } from "@/lib/users/userHubSections.ts";
import { DEFAULT_USER_HUB_SECTIONS } from "@/lib/users/userHubSections.ts";
import type { VisibilityMode } from "@/lib/visibility/sectionVisibility.ts";
import { userPreferencesPath } from "@/lib/navigation/userTabs.ts";

type Props = {
  userId: string;
  profileVisibility: string;
  hubSections: Required<UserHubSections>;
};

const VISIBILITY_BADGE_VARIANT: Record<string, "default" | "secondary" | "outline" | "destructive"> = {
  public: "default",
  platform: "secondary",
  relationships: "outline",
  private: "destructive",
};

export function UserHubVisibilitySection({ userId, profileVisibility, hubSections }: Props) {
  const t = useTranslations("userHub");
  const tProfile = useTranslations("profile");

  const profileVisibilityLabel = tProfile(`visibilityOptions.${profileVisibility}` as Parameters<typeof tProfile>[0]);

  const sections: Array<{ key: keyof UserHubSections; label: string }> = [
    { key: "identity", label: t("sections.identity") },
    { key: "about", label: t("sections.about") },
    { key: "entities", label: t("sections.entities") },
    { key: "contact", label: t("sections.contact") },
  ];

  return (
    <div className="flex flex-col gap-4">
      {/* Layer-1 profile visibility summary */}
      <div className="flex items-center justify-between rounded-lg border bg-muted/40 px-4 py-3">
        <div className="flex flex-col gap-0.5">
          <span className="text-sm font-medium">{t("visibilitySection.profileVisibility")}</span>
          <span className="text-xs text-muted-foreground">{t("visibilitySection.profileVisibilityHint")}</span>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant={VISIBILITY_BADGE_VARIANT[profileVisibility] ?? "secondary"}>
            {profileVisibilityLabel}
          </Badge>
          <Link
            href={userPreferencesPath(userId)}
            className="text-xs text-primary underline underline-offset-4 hover:text-foreground"
          >
            {t("visibilitySection.change")}
          </Link>
        </div>
      </div>

      {/* Layer-2 section visibility table */}
      <div className="overflow-hidden rounded-lg border">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b bg-muted/30">
              <th className="px-4 py-2.5 text-left font-medium text-muted-foreground">
                {t("visibilitySection.section")}
              </th>
              <th className="px-4 py-2.5 text-right font-medium text-muted-foreground">
                {t("visibilitySection.visibility")}
              </th>
            </tr>
          </thead>
          <tbody>
            {sections.map(({ key, label }, i) => {
              const mode = (hubSections[key]?.mode ?? DEFAULT_USER_HUB_SECTIONS[key].mode) as VisibilityMode;
              return (
                <tr key={key} className={i < sections.length - 1 ? "border-b" : undefined}>
                  <td className="px-4 py-3">{label}</td>
                  <td className="px-4 py-3 text-right">
                    <UserSectionVisibility
                      userId={userId}
                      sectionKey={key}
                      mode={mode}
                    />
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
