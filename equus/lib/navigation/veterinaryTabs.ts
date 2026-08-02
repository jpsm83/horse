/**
 * Veterinary tab navigation — tab list for all `/veterinaries/[veterinaryId]/*`
 * sub-pages.
 *
 * Tab order: Hub → Profile. Server-returned `allowedTabs` gate which tabs
 * render; when undefined (cache miss) only the Hub shows. User-linked profiles
 * have no admin tab — visibility toggles live in the Profile tab.
 */

import type { EntityTab } from "@/components/shared/entity-tabs.tsx";
import type { VeterinaryTab } from "@/lib/services/veterinaryService.ts";

const ALL_VETERINARY_TABS: EntityTab[] = [
  { id: "hub", label: "Hub", href: "" },
  { id: "profile", label: "Profile", href: "/profile" },
];

export function getVeterinaryTabs(
  veterinaryId: string,
  allowedTabs?: VeterinaryTab[],
): EntityTab[] {
  const base = `/veterinaries/${veterinaryId}`;

  if (!allowedTabs) {
    return [{ id: "hub", label: "Hub", href: base }];
  }

  const allowed = new Set(allowedTabs);
  return ALL_VETERINARY_TABS.filter((t) => allowed.has(t.id as VeterinaryTab)).map((t) => ({
    ...t,
    href: t.href ? `${base}${t.href}` : base,
  }));
}
