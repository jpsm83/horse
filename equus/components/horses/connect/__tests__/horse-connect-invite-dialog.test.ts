/**
 * @vitest-environment jsdom
 */
import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";

describe("HorseConnectInviteDialog", () => {
  it("uses discover provider invites instead of entity people search", () => {
    const source = readFileSync(
      join(process.cwd(), "components/horses/connect/horse-connect-invite-dialog.tsx"),
      "utf8",
    );

    expect(source).toContain("HorseProviderInvites");
    expect(source).not.toContain("UserInviteSection");
    expect(source).not.toContain("useEntitySearch");
    expect(source).not.toContain("/api/v1/search/entities");
  });
});
