/**
 * Breeder tab navigation — tab list for all `/breeders/[breederId]/*` sub-pages.
 *
 * Tab order: Hub → Profile → Admin. Server-returned `allowedTabs` gate which
 * tabs render; when undefined (cache miss) only the Hub shows.
 */

import type { EntityTab } from "@/components/shared/entity-tabs.tsx";
import type { BreederTab } from "@/lib/services/breederService.ts";

const ALL_BREEDER_TABS: EntityTab[] = [
  { id: "hub", label: "Hub", href: "" },
  { id: "profile", label: "Profile", href: "/profile" },
  { id: "admin", label: "Admin", href: "/admin" },
];

export function getBreederTabs(breederId: string, allowedTabs?: BreederTab[]): EntityTab[] {
  const base = `/breeders/${breederId}`;

  if (!allowedTabs) {
    return [{ id: "hub", label: "Hub", href: base }];
  }

  const allowed = new Set(allowedTabs);
  return ALL_BREEDER_TABS.filter((t) => allowed.has(t.id as BreederTab)).map((t) => ({
    ...t,
    href: t.href ? `${base}${t.href}` : base,
  }));
}
