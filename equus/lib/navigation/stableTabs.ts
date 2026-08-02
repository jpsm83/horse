/**
 * Stable tab navigation — tab list for all `/stables/[stableId]/*` sub-pages.
 *
 * Tab order: Hub → Profile → Admin. Server-returned `allowedTabs` gate which
 * tabs render; when undefined (cache miss) only the Hub shows.
 */

import type { EntityTab } from "@/components/shared/entity-tabs.tsx";
import type { StableTab } from "@/lib/services/stableService.ts";

const ALL_STABLE_TABS: EntityTab[] = [
  { id: "hub", label: "Hub", href: "" },
  { id: "profile", label: "Profile", href: "/profile" },
  { id: "admin", label: "Admin", href: "/admin" },
];

export function getStableTabs(stableId: string, allowedTabs?: StableTab[]): EntityTab[] {
  const base = `/stables/${stableId}`;

  if (!allowedTabs) {
    return [{ id: "hub", label: "Hub", href: base }];
  }

  const allowed = new Set(allowedTabs);
  return ALL_STABLE_TABS.filter((t) => allowed.has(t.id as StableTab)).map((t) => ({
    ...t,
    href: t.href ? `${base}${t.href}` : base,
  }));
}
