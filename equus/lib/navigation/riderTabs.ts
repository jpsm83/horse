/**
 * Rider tab navigation — tab list for all `/riders/[riderId]/*` sub-pages.
 *
 * Tab order: Hub → Profile. Server-returned `allowedTabs` gate which tabs
 * render; when undefined (cache miss) only the Hub shows. There is no Admin
 * tab — visibility toggles live on the Profile tab (user-linked profile).
 */

import type { EntityTab } from "@/components/shared/entity-tabs.tsx";
import type { RiderTab } from "@/lib/services/riderService.ts";

const ALL_RIDER_TABS: EntityTab[] = [
  { id: "hub", label: "Hub", href: "" },
  { id: "profile", label: "Profile", href: "/profile" },
];

export function getRiderTabs(riderId: string, allowedTabs?: RiderTab[]): EntityTab[] {
  const base = `/riders/${riderId}`;

  if (!allowedTabs) {
    return [{ id: "hub", label: "Hub", href: base }];
  }

  const allowed = new Set(allowedTabs);
  return ALL_RIDER_TABS.filter((t) => allowed.has(t.id as RiderTab)).map((t) => ({
    ...t,
    href: t.href ? `${base}${t.href}` : base,
  }));
}
