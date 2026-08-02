/**
 * Riding club tab navigation — tab list for all `/riding-clubs/[clubId]/*`
 * sub-pages.
 *
 * Tab order: Hub → Profile → Admin. Server-returned `allowedTabs` gate which
 * tabs render; when undefined (cache miss) only the Hub shows.
 */

import type { EntityTab } from "@/components/shared/entity-tabs.tsx";
import type { RidingClubTab } from "@/lib/services/ridingClubService.ts";

const ALL_RIDING_CLUB_TABS: EntityTab[] = [
  { id: "hub", label: "Hub", href: "" },
  { id: "profile", label: "Profile", href: "/profile" },
  { id: "admin", label: "Admin", href: "/admin" },
];

export function getRidingClubTabs(
  clubId: string,
  allowedTabs?: RidingClubTab[],
): EntityTab[] {
  const base = `/riding-clubs/${clubId}`;

  if (!allowedTabs) {
    return [{ id: "hub", label: "Hub", href: base }];
  }

  const allowed = new Set(allowedTabs);
  return ALL_RIDING_CLUB_TABS.filter((t) => allowed.has(t.id as RidingClubTab)).map((t) => ({
    ...t,
    href: t.href ? `${base}${t.href}` : base,
  }));
}
