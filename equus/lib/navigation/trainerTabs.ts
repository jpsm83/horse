/**
 * Trainer tab navigation — tab list for all `/trainers/[trainerId]/*` sub-pages.
 *
 * Tab order: Hub → Profile. Server-returned `allowedTabs` gate which tabs
 * render; when undefined (cache miss) only the Hub shows. User-linked profiles
 * have no admin tab — visibility toggles live in the Profile tab.
 */

import type { EntityTab } from "@/components/shared/entity-tabs.tsx";
import type { TrainerTab } from "@/lib/services/trainerService.ts";

const ALL_TRAINER_TABS: EntityTab[] = [
  { id: "hub", label: "Hub", href: "" },
  { id: "profile", label: "Profile", href: "/profile" },
];

export function getTrainerTabs(trainerId: string, allowedTabs?: TrainerTab[]): EntityTab[] {
  const base = `/trainers/${trainerId}`;

  if (!allowedTabs) {
    return [{ id: "hub", label: "Hub", href: base }];
  }

  const allowed = new Set(allowedTabs);
  return ALL_TRAINER_TABS.filter((t) => allowed.has(t.id as TrainerTab)).map((t) => ({
    ...t,
    href: t.href ? `${base}${t.href}` : base,
  }));
}
