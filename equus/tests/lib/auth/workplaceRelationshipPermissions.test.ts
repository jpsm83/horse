import { describe, expect, it } from "vitest";
import {
  hasCollaboratorCapability,
  hasStaffCapability,
  ownerHasCapability,
} from "@/lib/auth/workplaceRelationshipPermissions.ts";

describe("workplaceRelationshipPermissions", () => {
  it("grants admin all capabilities", () => {
    expect(hasCollaboratorCapability("admin", "manage_collaborators")).toBe(true);
    expect(hasCollaboratorCapability("admin", "edit_role_profile")).toBe(true);
    expect(hasCollaboratorCapability("admin", "view_role_profile")).toBe(true);
  });

  it("grants manager view and edit — not manage_collaborators", () => {
    expect(hasCollaboratorCapability("manager", "view_role_profile")).toBe(true);
    expect(hasCollaboratorCapability("manager", "edit_role_profile")).toBe(true);
    expect(hasCollaboratorCapability("manager", "manage_collaborators")).toBe(false);
  });

  it("grants staff view only", () => {
    expect(hasCollaboratorCapability("staff", "view_role_profile")).toBe(true);
    expect(hasCollaboratorCapability("staff", "edit_role_profile")).toBe(false);
    expect(hasCollaboratorCapability("staff", "manage_collaborators")).toBe(false);
  });

  it("maps legacy capability names", () => {
    expect(hasStaffCapability("admin", "manage_staff")).toBe(true);
    expect(hasStaffCapability("manager", "edit_profile")).toBe(true);
    expect(hasStaffCapability("staff", "view_profile")).toBe(true);
  });

  it("treats owner as having all capabilities", () => {
    expect(ownerHasCapability("manage_collaborators")).toBe(true);
    expect(ownerHasCapability("edit_role_profile")).toBe(true);
    expect(ownerHasCapability("view_role_profile")).toBe(true);
  });
});
