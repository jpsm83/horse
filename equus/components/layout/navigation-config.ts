/**
 * Header navigation link definitions — discovery (app-wide) and my-own (user-scoped).
 */

import type { LucideIcon } from "lucide-react";
import {
  Brush,
  Building2,
  ChessKnight,
  Dumbbell,
  GraduationCap,
  Hammer,
  ArrowRightLeft,
  Link2,
  PersonStanding,
  Sprout,
  Stethoscope,
  Truck,
  Users,
  Briefcase,
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
  | "trainers"
  | "groomers"
  | "farriers"
  | "riders";

export type UserActivityMenuKey = "workplaces" | "relationships" | "ownershipTransfers";

export type NavigationLinkItem = {
  key: NavigationEntityKey;
  href: string;
  icon: LucideIcon;
};

export type UserActivityLinkItem = {
  key: UserActivityMenuKey;
  href: string;
  icon: LucideIcon;
};

/** Signed-in user hubs — collaborations, horse relationship invites, etc. */
export const USER_ACTIVITY_LINKS: UserActivityLinkItem[] = [
  { key: "workplaces", href: "/workplaces", icon: Briefcase },
  { key: "relationships", href: "/relationships", icon: Link2 },
  { key: "ownershipTransfers", href: "/ownership-transfers", icon: ArrowRightLeft },
];

export const DISCOVER_LINKS: NavigationLinkItem[] = [
  { key: "stables", href: "/stables", icon: Building2 },
  { key: "veterinaries", href: "/veterinaries", icon: Stethoscope },
  { key: "transport", href: "/transport", icon: Truck },
  { key: "breeders", href: "/breeders", icon: Sprout },
  { key: "coaches", href: "/coaches", icon: GraduationCap },
  { key: "horses", href: "/horses", icon: ChessKnight  },
  { key: "ridingClubs", href: "/riding-clubs", icon: Users },
  { key: "trainers", href: "/trainers", icon: Dumbbell },
  { key: "groomers", href: "/groomers", icon: Brush },
  { key: "farriers", href: "/farriers", icon: Hammer },
  { key: "riders", href: "/riders", icon: PersonStanding },
];

export const MY_OWN_LINKS: NavigationLinkItem[] = [
  { key: "stables", href: "/my/stables", icon: Building2 },
  { key: "veterinaries", href: "/my/veterinaries", icon: Stethoscope },
  { key: "transport", href: "/my/transport", icon: Truck },
  { key: "breeders", href: "/my/breeders", icon: Sprout },
  { key: "coaches", href: "/my/coaches", icon: GraduationCap },
  { key: "horses", href: "/my/horses", icon: ChessKnight  },
  { key: "ridingClubs", href: "/my/riding-clubs", icon: Users },
  { key: "trainers", href: "/my/trainers", icon: Dumbbell },
  { key: "groomers", href: "/my/groomers", icon: Brush },
  { key: "farriers", href: "/my/farriers", icon: Hammer },
  { key: "riders", href: "/my/riders", icon: PersonStanding },
];

/**
 * URL segments for /create/* — matches `app/[locale]/create/` folder names.
 * Singular role profiles; short singular segments for horse, stable, riding club, transport.
 */
export const CREATE_ENTITY_ROUTE_SEGMENT: Record<NavigationEntityKey, string> = {
  horses: "horse",
  stables: "stable",
  ridingClubs: "riding-club",
  transport: "transport",
  breeders: "breeder",
  coaches: "coache",
  trainers: "trainer",
  groomers: "groomer",
  farriers: "farrier",
  riders: "rider",
  veterinaries: "veterinary",
};

function createEntityHref(key: NavigationEntityKey): string {
  return `/create/${CREATE_ENTITY_ROUTE_SEGMENT[key]}`;
}

export const CREATE_LINKS: NavigationLinkItem[] = MY_OWN_LINKS.map((item) => ({
  ...item,
  href: createEntityHref(item.key),
}));

/** User may own many of these — plural copy on /create/* titles and descriptions. */
export const PLURAL_OWNED_CREATE_ENTITIES = new Set<NavigationEntityKey>([
  "horses",
  "ridingClubs",
  "stables",
  "transport",
]);

function createMenuLinks(keys: NavigationEntityKey[]): NavigationLinkItem[] {
  return keys.map((key) => {
    const link = CREATE_LINKS.find((item) => item.key === key);
    if (!link) {
      throw new Error(`Missing create link for navigation key: ${key}`);
    }
    return link;
  });
}

/** User menu — direct link to add a horse. */
export const CREATE_MENU_HORSE_LINK = CREATE_LINKS.find((item) => item.key === "horses")!;

/** User menu — create a business (stable, riding club). */
export const CREATE_MENU_BUSINESS_LINKS = createMenuLinks(["stables", "ridingClubs"]);

/** User menu — add a service role profile. */
export const CREATE_MENU_SERVICE_LINKS = createMenuLinks([
  "breeders",
  "coaches",
  "farriers",
  "groomers",
  "riders",
  "trainers",
  "transport",
  "veterinaries",
]);

/** My-own links filtered by owned-profile flags from the navigation API. */
export function filterMyOwnLinks(owned: UserOwnedNavigation | null): NavigationLinkItem[] {
  if (!owned) return [];
  return MY_OWN_LINKS.filter((item) => owned[item.key]);
}

/** Home hub subsection order — businesses, services, horses last. */
const HOME_SUBSECTION_ORDER: NavigationEntityKey[] = [
  "stables",
  "ridingClubs",
  ...CREATE_MENU_SERVICE_LINKS.map((item) => item.key),
  "horses",
];

/** Owned-profile links for the home hub, in product order and only when the user has each subsection. */
export function filterHomeSubsectionLinks(
  owned: UserOwnedNavigation | null,
): NavigationLinkItem[] {
  if (!owned) return [];

  const byKey = new Map(MY_OWN_LINKS.map((item) => [item.key, item]));

  return HOME_SUBSECTION_ORDER.filter((key) => owned[key]).map((key) => {
    const link = byKey.get(key);
    if (!link) {
      throw new Error(`Missing my-own link for navigation key: ${key}`);
    }
    return link;
  });
}
