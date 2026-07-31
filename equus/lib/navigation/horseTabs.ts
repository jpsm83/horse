import type { EntityTab } from "@/components/shared/entity-tabs.tsx";
import type { HorseTab } from "@/lib/services/horseService.ts";

const ALL_HORSE_TABS: EntityTab[] = [
  { id: "hub", label: "Hub", href: "" },
  { id: "connect", label: "Connect", href: "/connect" },
  { id: "planning", label: "Planning", href: "/planning" },
  { id: "media", label: "Media", href: "/media" },
  { id: "documents", label: "Documents", href: "/documents" },
  { id: "profile", label: "Profile", href: "/profile" },
  { id: "admin", label: "Admin", href: "/admin" },
  { id: "history", label: "History", href: "/history" },
];

/**
 * Build the visible tab list for a horse page.
 *
 * @param horseId - Used to prefix all hrefs.
 * @param allowedTabs - Server-returned allowed tabs for the current viewer. When
 *   undefined (cache miss before layout fetch resolves), only hub is shown as the
 *   safest default — the server response will set the correct tabs on arrival.
 */
export function getHorseTabs(horseId: string, allowedTabs?: HorseTab[]): EntityTab[] {
  const base = `/horses/${horseId}`;

  if (!allowedTabs) {
    return [{ id: "hub", label: "Hub", href: base }];
  }

  const allowed = new Set(allowedTabs);
  return ALL_HORSE_TABS.filter((t) => allowed.has(t.id as HorseTab)).map((t) => ({
    ...t,
    href: t.href ? `${base}${t.href}` : base,
  }));
}
