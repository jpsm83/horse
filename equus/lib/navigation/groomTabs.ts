/**
 * Groom tab navigation — tab list for all `/groomers/[groomId]/*` sub-pages.
 *
 * Tab order: Hub → Profile. Server-returned `allowedTabs` gate which tabs
 * render; when undefined (cache miss) only the Hub shows.
 */

import type { EntityTab } from "@/components/shared/entity-tabs.tsx";
import type { GroomTab } from "@/lib/services/groomService.ts";

const ALL_GROOM_TABS: EntityTab[] = [
  { id: "hub", label: "Hub", href: "" },
  { id: "profile", label: "Profile", href: "/profile" },
];

export function getGroomTabs(groomId: string, allowedTabs?: GroomTab[]): EntityTab[] {
  const base = `/groomers/${groomId}`;

  if (!allowedTabs) {
    return [{ id: "hub", label: "Hub", href: base }];
  }

  const allowed = new Set(allowedTabs);
  return ALL_GROOM_TABS.filter((t) => allowed.has(t.id as GroomTab)).map((t) => ({
    ...t,
    href: t.href ? `${base}${t.href}` : base,
  }));
}
