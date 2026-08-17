import { describe, expect, it } from "vitest";
import {
  inviteCollaboratorSchema,
  inviteStaffSchema,
  updateCollaboratorSchema,
  updateStaffRoleSchema,
} from "@/lib/validations/workplaceRelationship.ts";

describe("workplaceRelationship validation", () => {
  it("parses invite with hierarchyLevel", () => {
    const parsed = inviteCollaboratorSchema.parse({
      email: "user@example.com",
      hierarchyLevel: "manager",
    });
    expect(parsed.hierarchyLevel).toBe("manager");
  });

  it("parses invite with legacy staffRole", () => {
    const parsed = inviteStaffSchema.parse({
      email: "user@example.com",
      staffRole: "staff",
    });
    expect(parsed.hierarchyLevel).toBe("staff");
  });

  it("parses update with staffRole alias", () => {
    const parsed = updateStaffRoleSchema.parse({ staffRole: "admin" });
    expect(parsed.hierarchyLevel).toBe("admin");
  });

  it("allows partial updateCollaboratorSchema", () => {
    const parsed = updateCollaboratorSchema.parse({ title: "Head groom" });
    expect(parsed.title).toBe("Head groom");
    expect(parsed.hierarchyLevel).toBeUndefined();
  });
});
