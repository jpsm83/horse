import { describe, expect, it } from "vitest";

import { pedigreeConnectInviteTemplate } from "@/lib/email/templates/pedigreeConnectInvite.ts";
import { ownershipTransferInviteTemplate } from "@/lib/email/templates/ownershipTransferInvite.ts";

describe("pedigreeConnectInviteTemplate", () => {
  it("includes initiator, role, and both horses", () => {
    const content = pedigreeConnectInviteTemplate({
      invitedEmail: "owner@example.com",
      initiatorLabel: "Alex Rider",
      role: "sire",
      parentHorseName: "Storm",
      childHorseName: "Thunder",
      childDetailsLine: "Lusitano · Gelding",
      acceptUrl: "https://equus.test/pedigree-connections?connection=1",
      isExistingUser: true,
      locale: "en",
    });

    expect(content.subject).toContain("Alex Rider");
    expect(content.subject).toContain("Storm");
    expect(content.text).toContain("Thunder");
    expect(content.text).toContain("does not transfer ownership");
  });
});

describe("ownershipTransferInviteTemplate", () => {
  it("describes transfer_main", () => {
    const content = ownershipTransferInviteTemplate({
      invitedEmail: "buyer@example.com",
      initiatorLabel: "Sam Owner",
      entityName: "Comet",
      entityType: "horse",
      transferKind: "transfer_main",
      acceptUrl: "https://equus.test/ownership-transfers?transfer=1",
      isExistingUser: true,
      locale: "en",
    });

    expect(content.subject).toContain("ownership");
    expect(content.text).toContain("Comet");
    expect(content.text).toContain("Sam Owner");
  });
});
