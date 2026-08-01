/**
 * Horse section visibility — shared Zod shapes and defaults.
 *
 * Keys match Profile/Admin section responsibilities (not parent form state).
 * All keys are Hub-facing: `buildHorseHubSections` projects cheap keys and
 * `attachHubSocialSections` projects list keys when Layer 2 allows.
 */

import { z } from "zod";
import { horseHubSectionKeys, visibilityEnums } from "@/utils/enums.ts";

export const hubSectionVisibilitySchema = z.object({
  mode: z.enum(visibilityEnums),
});

export const hubSectionsSchema = z.object({
  identity: hubSectionVisibilitySchema.optional(),
  identification: hubSectionVisibilitySchema.optional(),
  pedigree: hubSectionVisibilitySchema.optional(),
  about: hubSectionVisibilitySchema.optional(),
  ownership: hubSectionVisibilitySchema.optional(),
  value: hubSectionVisibilitySchema.optional(),
  proactiveRepresentatives: hubSectionVisibilitySchema.optional(),
  coOwnerManagement: hubSectionVisibilitySchema.optional(),
  gallery: hubSectionVisibilitySchema.optional(),
  planning: hubSectionVisibilitySchema.optional(),
  connections: hubSectionVisibilitySchema.optional(),
});

export type HubSectionKey = (typeof horseHubSectionKeys)[number];
export type HubSectionVisibility = z.infer<typeof hubSectionVisibilitySchema>;
export type HubSections = z.infer<typeof hubSectionsSchema>;

/** Raw document may still have legacy `overview` until migration runs. */
type HubSectionsRaw = HubSections & {
  overview?: HubSectionVisibility;
};

export const DEFAULT_HUB_SECTIONS: Required<HubSections> = {
  identity: { mode: "public" },
  identification: { mode: "public" },
  pedigree: { mode: "public" },
  about: { mode: "public" },
  ownership: { mode: "relationship" },
  value: { mode: "owner" },
  proactiveRepresentatives: { mode: "owner" },
  coOwnerManagement: { mode: "owner" },
  gallery: { mode: "public" },
  planning: { mode: "public" },
  connections: { mode: "relationship" },
};

export function normalizeHubSections(
  raw: HubSectionsRaw | null | undefined,
): Required<HubSections> {
  const legacyOverview = raw?.overview?.mode;
  return {
    identity: {
      mode: raw?.identity?.mode ?? legacyOverview ?? DEFAULT_HUB_SECTIONS.identity.mode,
    },
    identification: {
      mode: raw?.identification?.mode ?? DEFAULT_HUB_SECTIONS.identification.mode,
    },
    pedigree: { mode: raw?.pedigree?.mode ?? DEFAULT_HUB_SECTIONS.pedigree.mode },
    about: { mode: raw?.about?.mode ?? DEFAULT_HUB_SECTIONS.about.mode },
    ownership: { mode: raw?.ownership?.mode ?? DEFAULT_HUB_SECTIONS.ownership.mode },
    value: { mode: raw?.value?.mode ?? DEFAULT_HUB_SECTIONS.value.mode },
    proactiveRepresentatives: {
      mode:
        raw?.proactiveRepresentatives?.mode ??
        DEFAULT_HUB_SECTIONS.proactiveRepresentatives.mode,
    },
    coOwnerManagement: {
      mode: raw?.coOwnerManagement?.mode ?? DEFAULT_HUB_SECTIONS.coOwnerManagement.mode,
    },
    gallery: { mode: raw?.gallery?.mode ?? DEFAULT_HUB_SECTIONS.gallery.mode },
    planning: { mode: raw?.planning?.mode ?? DEFAULT_HUB_SECTIONS.planning.mode },
    connections: {
      mode: raw?.connections?.mode ?? DEFAULT_HUB_SECTIONS.connections.mode,
    },
  };
}

/** Map Profile/Admin UI sectionKey → hubSections key (1:1). */
export function hubKeyFromUiSectionKey(sectionKey: string): HubSectionKey | undefined {
  switch (sectionKey) {
    case "profile-identity":
      return "identity";
    case "profile-identification":
      return "identification";
    case "profile-pedigree":
      return "pedigree";
    case "profile-about":
      return "about";
    case "admin-ownership":
    case "hub-ownership":
      return "ownership";
    case "admin-value":
      return "value";
    case "admin-proactive-representatives":
      return "proactiveRepresentatives";
    case "admin-co-owner-management":
      return "coOwnerManagement";
    case "media-gallery":
      return "gallery";
    case "planning-calendar":
      return "planning";
    case "connect-connections":
      return "connections";
    default:
      return undefined;
  }
}
