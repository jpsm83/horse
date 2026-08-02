/**
 * Transport tab navigation — tab list for all `/transport/[transportId]/*`
 * sub-pages.
 *
 * Tab order: Hub → Profile → Admin. Server-returned `allowedTabs` gate which
 * tabs render; when undefined (cache miss) only the Hub shows.
 */

import type { EntityTab } from "@/components/shared/entity-tabs.tsx";
import type { TransportTab } from "@/lib/services/transportService.ts";

const ALL_TRANSPORT_TABS: EntityTab[] = [
  { id: "hub", label: "Hub", href: "" },
  { id: "profile", label: "Profile", href: "/profile" },
  { id: "admin", label: "Admin", href: "/admin" },
];

export function getTransportTabs(
  transportId: string,
  allowedTabs?: TransportTab[],
): EntityTab[] {
  const base = `/transport/${transportId}`;

  if (!allowedTabs) {
    return [{ id: "hub", label: "Hub", href: base }];
  }

  const allowed = new Set(allowedTabs);
  return ALL_TRANSPORT_TABS.filter((t) => allowed.has(t.id as TransportTab)).map((t) => ({
    ...t,
    href: t.href ? `${base}${t.href}` : base,
  }));
}
