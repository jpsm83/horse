/**
 * User tab navigation — path helpers and tab list for all /user/[userId]/* sub-pages.
 *
 * Tab order: Hub → Profile → Preferences → Notifications → Workplace → Relationships
 */

import type { EntityTab } from "@/components/shared/entity-tabs.tsx";

// --- Path helpers ---

export function userHubPath(userId: string): string {
  return `/user/${userId}`;
}

export function userProfilePath(userId: string): string {
  return `/user/${userId}/profile`;
}

export function userPreferencesPath(userId: string): string {
  return `/user/${userId}/preferences`;
}

export function userNotificationsPath(userId: string): string {
  return `/user/${userId}/notifications`;
}

export function userWorkplacePath(userId: string): string {
  return `/user/${userId}/workplace`;
}

export function userRelationshipsPath(userId: string): string {
  return `/user/${userId}/relationships`;
}

// --- Tab list ---

export type UserTabLabels = {
  hub: string;
  profile: string;
  preferences: string;
  notifications: string;
  workplace: string;
  relationships: string;
};

export function getUserTabs(userId: string, labels: UserTabLabels): EntityTab[] {
  return [
    { id: "hub", label: labels.hub, href: userHubPath(userId) },
    { id: "profile", label: labels.profile, href: userProfilePath(userId) },
    { id: "preferences", label: labels.preferences, href: userPreferencesPath(userId) },
    { id: "notifications", label: labels.notifications, href: userNotificationsPath(userId) },
    { id: "workplace", label: labels.workplace, href: userWorkplacePath(userId) },
    { id: "relationships", label: labels.relationships, href: userRelationshipsPath(userId) },
  ];
}
