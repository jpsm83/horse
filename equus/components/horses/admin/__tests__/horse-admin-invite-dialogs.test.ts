/**
 * @vitest-environment jsdom
 */
import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";

describe("horse admin invite dialogs", () => {
  it("HorseAdminRoleInviteDialog uses email invite instead of people search", () => {
    const source = readFileSync(
      join(process.cwd(), "components/horses/admin/horse-admin-role-invite-dialog.tsx"),
      "utf8",
    );

    expect(source).toContain("EmailInviteSection");
    expect(source).not.toContain("UserInviteSection");
    expect(source).not.toContain("useUserSearch");
    expect(source).not.toContain("/api/v1/users/search");
    expect(source).not.toContain("receiverUserId");
  });

  it("HorseOwnershipChangeDialog uses email invite instead of people search", () => {
    const source = readFileSync(
      join(process.cwd(), "components/horses/admin/horse-ownership-change-dialog.tsx"),
      "utf8",
    );

    expect(source).toContain("EmailInviteSection");
    expect(source).not.toContain("UserInviteSection");
    expect(source).not.toContain("useUserSearch");
    expect(source).not.toContain("/api/v1/users/search");
    expect(source).not.toContain("receiverUserId");
  });
});
