/**
 * Coach tab navigation — tab list for all `/coaches/[coachId]/*` sub-pages.
 *
 * Tab order: Hub → Profile. Server-returned `allowedTabs` gate which tabs
 * render; when undefined (cache miss) only the Hub shows. There is no Admin
 * tab — visibility toggles live on the Profile tab (user-linked profile).
 */

import type { EntityTab } from "@/components/shared/entity-tabs.tsx";
import type { CoachTab } from "@/lib/services/coachService.ts";

const ALL_COACH_TABS: EntityTab[] = [
  { id: "hub", label: "Hub", href: "" },
  { id: "profile", label: "Profile", href: "/profile" },
];

export function getCoachTabs(coachId: string, allowedTabs?: CoachTab[]): EntityTab[] {
  const base = `/coaches/${coachId}`;

  if (!allowedTabs) {
    return [{ id: "hub", label: "Hub", href: base }];
  }

  const allowed = new Set(allowedTabs);
  return ALL_COACH_TABS.filter((t) => allowed.has(t.id as CoachTab)).map((t) => ({
    ...t,
    href: t.href ? `${base}${t.href}` : base,
  }));
}
