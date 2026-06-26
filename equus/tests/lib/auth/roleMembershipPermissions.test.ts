import { describe, expect, it } from "vitest";
import {
  hasStaffCapability,
  ownerHasCapability,
  type RoleProfileCapability,
} from "@/lib/auth/roleMembershipPermissions.ts";

const ALL_CAPABILITIES: RoleProfileCapability[] = [
  "manage_staff",
  "edit_profile",
  "view_profile",
];

describe("roleMembershipPermissions", () => {
  it("grants admin all capabilities", () => {
    for (const capability of ALL_CAPABILITIES) {
      expect(hasStaffCapability("admin", capability)).toBe(true);
    }
  });

  it("grants manager view and edit — not manage_staff", () => {
    expect(hasStaffCapability("manager", "view_profile")).toBe(true);
    expect(hasStaffCapability("manager", "edit_profile")).toBe(true);
    expect(hasStaffCapability("manager", "manage_staff")).toBe(false);
  });

  it("grants staff view only", () => {
    expect(hasStaffCapability("staff", "view_profile")).toBe(true);
    expect(hasStaffCapability("staff", "edit_profile")).toBe(false);
    expect(hasStaffCapability("staff", "manage_staff")).toBe(false);
  });

  it("treats owner as having all capabilities", () => {
    for (const capability of ALL_CAPABILITIES) {
      expect(ownerHasCapability(capability)).toBe(true);
    }
  });
});
