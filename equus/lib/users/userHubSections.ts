/**
 * User section visibility — shared Zod shapes and defaults.
 *
 * Keys map to the four hub sections displayed on the user public profile.
 * Entity adapter: UserSectionVisibility → PATCH /api/v1/users/me/hub-sections.
 */

import { z } from "zod";
import { userHubSectionKeys, visibilityEnums } from "@/utils/enums.ts";

export const userHubSectionVisibilitySchema = z.object({
  mode: z.enum(visibilityEnums),
});

export const userHubSectionsSchema = z.object({
  identity: userHubSectionVisibilitySchema.optional(),
  about: userHubSectionVisibilitySchema.optional(),
  entities: userHubSectionVisibilitySchema.optional(),
  contact: userHubSectionVisibilitySchema.optional(),
});

export type UserHubSectionKey = (typeof userHubSectionKeys)[number];
export type UserHubSectionVisibility = z.infer<typeof userHubSectionVisibilitySchema>;
export type UserHubSections = z.infer<typeof userHubSectionsSchema>;

export const DEFAULT_USER_HUB_SECTIONS: Required<UserHubSections> = {
  identity: { mode: "public" },
  about: { mode: "public" },
  entities: { mode: "public" },
  contact: { mode: "relationship" },
};

export function normalizeUserHubSections(
  raw: UserHubSections | null | undefined,
): Required<UserHubSections> {
  return {
    identity: { mode: raw?.identity?.mode ?? DEFAULT_USER_HUB_SECTIONS.identity.mode },
    about: { mode: raw?.about?.mode ?? DEFAULT_USER_HUB_SECTIONS.about.mode },
    entities: { mode: raw?.entities?.mode ?? DEFAULT_USER_HUB_SECTIONS.entities.mode },
    contact: { mode: raw?.contact?.mode ?? DEFAULT_USER_HUB_SECTIONS.contact.mode },
  };
}
