import { describe, expect, it } from "vitest";

import {
  canExposeUserIdentity,
  canStartDirectMessage,
  resolveAudienceForRequester,
  toPublicUserIdentity,
} from "@/lib/privacy/userVisibility.ts";

describe("userVisibility", () => {
  it("resolves requester audience with relationship priority", () => {
    expect(
      resolveAudienceForRequester({
        isAuthenticated: false,
        hasRelationship: false,
        hasCollaboration: false,
      }),
    ).toBe("public");

    expect(
      resolveAudienceForRequester({
        isAuthenticated: true,
        hasRelationship: false,
        hasCollaboration: false,
      }),
    ).toBe("platform");

    expect(
      resolveAudienceForRequester({
        isAuthenticated: true,
        hasRelationship: true,
        hasCollaboration: true,
      }),
    ).toBe("relationship");
  });

  it("applies profile visibility matrix", () => {
    expect(canExposeUserIdentity({ profileVisibility: "public" }, "public")).toBe(true);
    expect(canExposeUserIdentity({ profileVisibility: "platform" }, "public")).toBe(false);
    expect(canExposeUserIdentity({ profileVisibility: "platform" }, "platform")).toBe(true);
    expect(canExposeUserIdentity({ profileVisibility: "relationships" }, "platform")).toBe(false);
    expect(canExposeUserIdentity({ profileVisibility: "relationships" }, "relationship")).toBe(
      true,
    );
    expect(canExposeUserIdentity({ profileVisibility: "private" }, "relationship")).toBe(true);
    expect(canExposeUserIdentity({ profileVisibility: "private" }, "platform")).toBe(false);
  });

  it("evaluates direct message policy", () => {
    expect(canStartDirectMessage({ allowDirectMessagesFrom: "everyone" }, "platform")).toBe(true);
    expect(canStartDirectMessage({ allowDirectMessagesFrom: "everyone" }, "public")).toBe(false);
    expect(
      canStartDirectMessage({ allowDirectMessagesFrom: "relationships" }, "relationship"),
    ).toBe(true);
    expect(canStartDirectMessage({ allowDirectMessagesFrom: "relationships" }, "platform")).toBe(
      false,
    );
    expect(canStartDirectMessage({ allowDirectMessagesFrom: "nobody" }, "relationship")).toBe(
      false,
    );
  });

  it("maps identity fields through visibility policy", () => {
    const mapped = toPublicUserIdentity(
      {
        _id: "507f1f77bcf86cd799439011",
        personalDetails: {
          email: "private@example.com",
          firstName: "Private",
          lastName: "User",
          phoneNumber: "+351900000000",
        },
        preferences: { profileVisibility: "private" },
      },
      "platform",
    );

    expect(mapped).toEqual({
      id: "507f1f77bcf86cd799439011",
      email: undefined,
      firstName: undefined,
      lastName: undefined,
      phone: undefined,
    });
  });
});

