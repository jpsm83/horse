/**
 * Farrier tab navigation — tab list for all `/farriers/[farrierId]/*`
 * sub-pages.
 *
 * Tab order: Hub → Profile. Server-returned `allowedTabs` gate which tabs
 * render; when undefined (cache miss) only the Hub shows.
 */

import type { EntityTab } from "@/components/shared/entity-tabs.tsx";
import type { FarrierTab } from "@/lib/services/farrierService.ts";

const ALL_FARRIER_TABS: EntityTab[] = [
  { id: "hub", label: "Hub", href: "" },
  { id: "profile", label: "Profile", href: "/profile" },
];

export function getFarrierTabs(
  farrierId: string,
  allowedTabs?: FarrierTab[],
): EntityTab[] {
  const base = `/farriers/${farrierId}`;

  if (!allowedTabs) {
    return [{ id: "hub", label: "Hub", href: base }];
  }

  const allowed = new Set(allowedTabs);
  return ALL_FARRIER_TABS.filter((t) => allowed.has(t.id as FarrierTab)).map((t) => ({
    ...t,
    href: t.href ? `${base}${t.href}` : base,
  }));
}
