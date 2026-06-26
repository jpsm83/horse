import { describe, expect, it } from "vitest";
import { staffInviteTemplate } from "@/lib/email/templates/staffInvite.ts";

describe("staffInvite template", () => {
  const baseInput = {
    invitedEmail: "worker@example.com",
    profileName: "Oak Stables",
    roleTypeLabel: "Stable",
    staffRole: "manager",
    inviterName: "Jane Owner",
    acceptUrl: "https://app.test/signup?ref=abc123",
  };

  it("includes profile name and accept URL for new users", () => {
    const { subject, html, text } = staffInviteTemplate({
      ...baseInput,
      isExistingUser: false,
    });

    expect(subject).toContain("Oak Stables");
    expect(html).toContain(baseInput.acceptUrl);
    expect(html).toContain("Jane Owner");
    expect(html).toContain("manager");
    expect(text).toContain("Create your Equus account");
  });

  it("uses existing-user copy when invitee already has an account", () => {
    const { html, text } = staffInviteTemplate({
      ...baseInput,
      acceptUrl: "https://app.test/workplaces?membership=abc123",
      isExistingUser: true,
    });

    expect(html).toContain("Sign in to accept");
    expect(text).toContain("Sign in to accept");
  });
});
