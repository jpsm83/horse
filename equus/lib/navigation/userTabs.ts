import type { EntityTab } from "@/components/shared/entity-tabs.tsx";

export function userProfilePath(userId: string): string {
  return `/user/${userId}/profile`;
}

export function userPreferencesPath(userId: string): string {
  return `/user/${userId}/preferences`;
}

export function getUserTabs(
  userId: string,
  labels: { profile: string; preferences: string },
): EntityTab[] {
  return [
    {
      id: "profile",
      label: labels.profile,
      href: userProfilePath(userId),
    },
    {
      id: "preferences",
      label: labels.preferences,
      href: userPreferencesPath(userId),
    },
  ];
}
