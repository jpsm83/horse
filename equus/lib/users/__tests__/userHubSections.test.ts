/**
 * User hub section projections — pure unit tests for canViewUserHubSection and
 * buildUserHubSections (no DB).
 */

import { describe, expect, it } from "vitest";

import {
  buildUserHubSections,
  canViewUserHubSection,
  type UserHubSectionsProjection,
} from "@/lib/users/userHubSections.ts";
import type { UserVisibilityAudience } from "@/lib/privacy/userVisibility.ts";

const USER_DOC: Record<string, unknown> = {
  userType: "individual",
  personalDetails: {
    firstName: "Ada",
    lastName: "Lovelace",
    username: "ada",
    email: "ada@example.com",
    phoneNumber: "+123",
    nationality: "GB",
    idType: "Passport",
    idNumber: "X123",
    imageUrl: "https://img.example/ada.png",
    bio: "Mathematician",
    address: { city: "London", country: "GB" },
  },
  businessDetails: {},
  hubSections: {
    identity: { mode: "public" },
    identification: { mode: "relationship" },
    address: { mode: "relationship" },
    contact: { mode: "relationship" },
    entities: { mode: "public" },
  },
};

const AUDIENCES: UserVisibilityAudience[] = [
  "self",
  "public",
  "platform",
  "relationship",
  "collaboration",
];

describe("canViewUserHubSection", () => {
  it("public mode is visible to every audience", () => {
    for (const audience of AUDIENCES) {
      expect(canViewUserHubSection(USER_DOC, "identity", audience)).toBe(true);
    }
  });

  it("relationship mode hides from public/platform, shows to relationship/collaboration/self", () => {
    expect(canViewUserHubSection(USER_DOC, "contact", "public")).toBe(false);
    expect(canViewUserHubSection(USER_DOC, "contact", "platform")).toBe(false);
    expect(canViewUserHubSection(USER_DOC, "contact", "relationship")).toBe(true);
    expect(canViewUserHubSection(USER_DOC, "contact", "collaboration")).toBe(true);
    expect(canViewUserHubSection(USER_DOC, "contact", "self")).toBe(true);
  });

  it("owner mode is visible to self only", () => {
    const hubSections = {
      ...(USER_DOC.hubSections as Record<string, { mode: string }>),
      address: { mode: "owner" },
    };
    const doc = { ...USER_DOC, hubSections };
    expect(canViewUserHubSection(doc, "address", "self")).toBe(true);
    expect(canViewUserHubSection(doc, "address", "relationship")).toBe(false);
    expect(canViewUserHubSection(doc, "address", "public")).toBe(false);
  });

  it("falls back to defaults when hubSections is missing", () => {
    expect(canViewUserHubSection({}, "identity", "public")).toBe(true);
    expect(canViewUserHubSection({}, "contact", "public")).toBe(false);
  });
});

describe("buildUserHubSections", () => {
  it("projects identity for public, omits relationship-gated sections", () => {
    const sections: UserHubSectionsProjection = buildUserHubSections(USER_DOC, "public");
    expect(sections.identity?.firstName).toBe("Ada");
    expect(sections.identity?.username).toBe("ada");
    expect(sections.identity?.bio).toBe("Mathematician");
    expect(sections.identification).toBeUndefined();
    expect(sections.address).toBeUndefined();
    expect(sections.contact).toBeUndefined();
    expect(sections.entities).toBeUndefined();
  });

  it("self sees all sections including identification/address/contact", () => {
    const sections: UserHubSectionsProjection = buildUserHubSections(USER_DOC, "self");
    expect(sections.identity).toBeDefined();
    expect(sections.identification?.nationality).toBe("GB");
    expect(sections.identification?.phoneNumber).toBe("+123");
    expect(sections.identification?.idType).toBe("Passport");
    expect(sections.address?.location).toBe("London, GB");
    expect(sections.contact?.email).toBe("ada@example.com");
  });

  it("business accounts surface businessName in identity", () => {
    const doc = {
      ...USER_DOC,
      userType: "business",
      businessDetails: { businessName: "Lovelace Equine" },
    };
    const sections: UserHubSectionsProjection = buildUserHubSections(doc, "public");
    expect(sections.identity?.businessName).toBe("Lovelace Equine");
    expect(sections.identity?.userType).toBe("business");
  });
});
