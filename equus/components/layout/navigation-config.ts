/**
 * Header navigation link definitions — discovery (app-wide) and my-own (user-scoped).
 */

import type { LucideIcon } from "lucide-react";
import {
  Building2,
  CircleDot,
  Dumbbell,
  GraduationCap,
  Sprout,
  Stethoscope,
  Truck,
  Users,
} from "lucide-react";

import type { UserOwnedNavigation } from "@/lib/services/navigationService.ts";

export type NavigationEntityKey =
  | "stables"
  | "veterinaries"
  | "transport"
  | "breeders"
  | "coaches"
  | "horses"
  | "ridingClubs"
  | "trainers";

export type NavigationLinkItem = {
  key: NavigationEntityKey;
  href: string;
  icon: LucideIcon;
};

export const DISCOVER_LINKS: NavigationLinkItem[] = [
  { key: "stables", href: "/stables", icon: Building2 },
  { key: "veterinaries", href: "/veterinaries", icon: Stethoscope },
  { key: "transport", href: "/transport", icon: Truck },
  { key: "breeders", href: "/breeders", icon: Sprout },
  { key: "coaches", href: "/coaches", icon: GraduationCap },
  { key: "horses", href: "/horses", icon: CircleDot },
  { key: "ridingClubs", href: "/riding-clubs", icon: Users },
  { key: "trainers", href: "/trainers", icon: Dumbbell },
];

const MY_OWN_LINKS: NavigationLinkItem[] = [
  { key: "stables", href: "/my/stables", icon: Building2 },
  { key: "veterinaries", href: "/my/veterinaries", icon: Stethoscope },
  { key: "transport", href: "/my/transport", icon: Truck },
  { key: "breeders", href: "/my/breeders", icon: Sprout },
  { key: "coaches", href: "/my/coaches", icon: GraduationCap },
  { key: "horses", href: "/my/horses", icon: CircleDot },
  { key: "ridingClubs", href: "/my/riding-clubs", icon: Users },
  { key: "trainers", href: "/my/trainers", icon: Dumbbell },
];

/** My-own links filtered by owned-profile flags from the navigation API. */
export function filterMyOwnLinks(owned: UserOwnedNavigation | null): NavigationLinkItem[] {
  if (!owned) return [];
  return MY_OWN_LINKS.filter((item) => owned[item.key]);
}
