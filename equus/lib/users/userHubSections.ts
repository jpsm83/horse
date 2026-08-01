/**
 * User section visibility — shared Zod shapes, defaults, and hub projections.
 *
 * Keys map 1:1 to the Profile tab sections and the public hub sections.
 * Entity adapter: UserSectionVisibility → PATCH /api/v1/users/me/hub-sections.
 */

import { z } from "zod";
import { userHubSectionKeys, visibilityEnums } from "@/utils/enums.ts";
import type { UserVisibilityAudience } from "@/lib/privacy/userVisibility.ts";

export const userHubSectionVisibilitySchema = z.object({
  mode: z.enum(visibilityEnums),
});

export const userHubSectionsSchema = z.object({
  identity: userHubSectionVisibilitySchema.optional(),
  identification: userHubSectionVisibilitySchema.optional(),
  address: userHubSectionVisibilitySchema.optional(),
  contact: userHubSectionVisibilitySchema.optional(),
  entities: userHubSectionVisibilitySchema.optional(),
});

export type UserHubSectionKey = (typeof userHubSectionKeys)[number];
export type UserHubSectionVisibility = z.infer<typeof userHubSectionVisibilitySchema>;
export type UserHubSections = z.infer<typeof userHubSectionsSchema>;

export const DEFAULT_USER_HUB_SECTIONS: Required<UserHubSections> = {
  identity: { mode: "public" },
  identification: { mode: "relationship" },
  address: { mode: "relationship" },
  contact: { mode: "relationship" },
  entities: { mode: "public" },
};

export function normalizeUserHubSections(
  raw: UserHubSections | null | undefined,
): Required<UserHubSections> {
  return {
    identity: { mode: raw?.identity?.mode ?? DEFAULT_USER_HUB_SECTIONS.identity.mode },
    identification: {
      mode: raw?.identification?.mode ?? DEFAULT_USER_HUB_SECTIONS.identification.mode,
    },
    address: { mode: raw?.address?.mode ?? DEFAULT_USER_HUB_SECTIONS.address.mode },
    contact: { mode: raw?.contact?.mode ?? DEFAULT_USER_HUB_SECTIONS.contact.mode },
    entities: { mode: raw?.entities?.mode ?? DEFAULT_USER_HUB_SECTIONS.entities.mode },
  };
}

// --- Hub projections (server-filtered by L1 profileVisibility + L2 hubSections) ---

export type UserHubIdentitySection = {
  firstName?: string;
  lastName?: string;
  username?: string;
  imageUrl?: string;
  bio?: string;
  businessName?: string;
  userType?: string;
};

export type UserHubIdentificationSection = {
  nationality?: string;
  phoneNumber?: string;
  idType?: string;
  idNumber?: string;
};

export type UserHubAddressSection = {
  location?: string;
};

export type UserHubContactSection = {
  email?: string;
};

export type UserHubEntityItem = {
  entityType: string;
  entityId: string;
  name: string;
  imageUrl?: string;
};

export type UserHubEntitiesSection = {
  entities: UserHubEntityItem[];
};

export type UserHubSectionsProjection = {
  identity?: UserHubIdentitySection;
  identification?: UserHubIdentificationSection;
  address?: UserHubAddressSection;
  contact?: UserHubContactSection;
  entities?: UserHubEntitiesSection;
};

/**
 * Layer-2 gate for a single user hub section, given the requester audience.
 * Modes mirror the horse (`public` | `relationship` | `owner`); `relationship`
 * maps to the relationship / collaboration audiences.
 */
export function canViewUserHubSection(
  userDoc: Record<string, unknown>,
  key: UserHubSectionKey,
  audience: UserVisibilityAudience,
): boolean {
  const hubSections = normalizeUserHubSections(
    (userDoc.hubSections ?? {}) as UserHubSections | undefined,
  );
  const mode = hubSections[key].mode;

  if (mode === "public") return true;
  if (mode === "relationship") {
    return (
      audience === "self" ||
      audience === "relationship" ||
      audience === "collaboration"
    );
  }
  return audience === "self"; // owner
}

/**
 * Cheap user hub section projections (identity / identification / address /
 * contact) filtered by Layer-2 `hubSections` modes. Entities is a list and is
 * attached separately (see getUserHub / getUserView). Pure — no DB access,
 * mirrors buildHorseHubSections. Layer-1 `profileVisibility` is enforced by the
 * caller (getUserHub 404s when the requester may not view the profile at all).
 */
export function buildUserHubSections(
  userDoc: Record<string, unknown>,
  audience: UserVisibilityAudience,
): Omit<UserHubSectionsProjection, "entities"> {
  const sections: Omit<UserHubSectionsProjection, "entities"> = {};
  const pd = (userDoc.personalDetails ?? {}) as Record<string, unknown>;
  const businessDetails = (userDoc.businessDetails ?? {}) as Record<string, unknown>;

  if (canViewUserHubSection(userDoc, "identity", audience)) {
    sections.identity = {
      firstName: pd.firstName as string | undefined,
      lastName: pd.lastName as string | undefined,
      username: pd.username as string | undefined,
      imageUrl: pd.imageUrl as string | undefined,
      bio: pd.bio as string | undefined,
      businessName: businessDetails.businessName as string | undefined,
      userType: (userDoc.userType as string) ?? "individual",
    };
  }

  if (canViewUserHubSection(userDoc, "identification", audience)) {
    sections.identification = {
      nationality: pd.nationality as string | undefined,
      phoneNumber: pd.phoneNumber as string | undefined,
      idType: pd.idType as string | undefined,
      idNumber: pd.idNumber as string | undefined,
    };
  }

  if (canViewUserHubSection(userDoc, "address", audience)) {
    const address = (pd.address ?? {}) as Record<string, unknown>;
    const location = [address.city, address.country].filter(Boolean).join(", ");
    sections.address = {
      location: location || undefined,
    };
  }

  if (canViewUserHubSection(userDoc, "contact", audience)) {
    sections.contact = {
      email: pd.email as string | undefined,
    };
  }

  return sections;
}
