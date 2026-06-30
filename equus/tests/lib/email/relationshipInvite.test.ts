import { describe, expect, it } from "vitest";
import { relationshipInviteTemplate } from "@/lib/email/templates/relationshipInvite.ts";

describe("relationshipInvite template", () => {
  const baseInput = {
    invitedEmail: "owner@example.com",
    horseName: "Thunder",
    relationshipType: "veterinary",
    requesterLabel: "Dr. Smith",
    referralReference: "REF-12345",
    acceptUrl: "https://app.test/signup?ref=REF-12345",
  };

  it("builds vet-added-horse variant with referral reference", () => {
    const { subject, html, text } = relationshipInviteTemplate({
      ...baseInput,
      variant: "vetAddedHorse",
    });

    expect(subject).toContain("Dr. Smith");
    expect(subject).toContain("Thunder");
    expect(html).toContain("REF-12345");
    expect(html).toContain(baseInput.acceptUrl);
    expect(text).toContain("Your vet Dr. Smith");
  });

  it("builds owner-invites-vet variant", () => {
    const { subject, html } = relationshipInviteTemplate({
      ...baseInput,
      variant: "ownerInvitesVet",
    });

    expect(subject).toContain("vet");
    expect(html).toContain("connect as their vet");
  });

  it("builds owner-invites-provider variant for new users", () => {
    const { subject, html } = relationshipInviteTemplate({
      ...baseInput,
      variant: "ownerInvitesProvider",
      isExistingUser: false,
    });

    expect(subject).toContain("Dr. Smith");
    expect(html).toContain("REF-12345");
    expect(html).toContain("Create your account");
  });

  it("builds owner-invites-provider variant for existing users", () => {
    const acceptUrl = "https://app.test/relationships?relationship=abc123";
    const { subject, html } = relationshipInviteTemplate({
      ...baseInput,
      acceptUrl,
      variant: "ownerInvitesProvider",
      isExistingUser: true,
    });

    expect(subject).toContain("Thunder");
    expect(html).toContain(acceptUrl);
    expect(html).toContain("Sign in to accept");
    expect(html).not.toContain("REF-12345");
  });
});
