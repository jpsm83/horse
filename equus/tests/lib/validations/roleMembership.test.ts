import { describe, expect, it } from "vitest";
import { inviteStaffSchema, updateStaffRoleSchema } from "@/lib/validations/roleMembership.ts";

describe("inviteStaffSchema", () => {
  it("accepts valid email and staff role", () => {
    const parsed = inviteStaffSchema.parse({
      email: "Staff@Example.com",
      staffRole: "manager",
    });

    expect(parsed.email).toBe("staff@example.com");
    expect(parsed.staffRole).toBe("manager");
  });

  it("rejects invalid email", () => {
    expect(() =>
      inviteStaffSchema.parse({
        email: "not-an-email",
        staffRole: "staff",
      }),
    ).toThrow();
  });

  it("rejects invalid staff role", () => {
    expect(() =>
      inviteStaffSchema.parse({
        email: "staff@example.com",
        staffRole: "owner",
      }),
    ).toThrow();
  });
});

describe("updateStaffRoleSchema", () => {
  it("accepts admin role update", () => {
    const parsed = updateStaffRoleSchema.parse({ staffRole: "admin" });
    expect(parsed.staffRole).toBe("admin");
  });
});
