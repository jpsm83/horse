import { describe, expect, it } from "vitest";

import { getUserTabs } from "@/lib/navigation/userTabs.ts";

const labels = {
  hub: "Hub",
  profile: "Profile",
  preferences: "Preferences",
  notifications: "Notifications",
  workplace: "Workplace",
  relationships: "Relationships",
};

describe("getUserTabs", () => {
  it("lists self account tabs without a subscription tab", () => {
    const tabs = getUserTabs("u1", labels);

    expect(tabs.map((tab) => tab.id)).toEqual([
      "hub",
      "profile",
      "preferences",
      "notifications",
      "workplace",
      "relationships",
    ]);
    expect(tabs.some((tab) => tab.id === "subscription")).toBe(false);
    expect(tabs[0]?.href).toBe("/user/u1");
    expect(tabs[5]?.href).toBe("/user/u1/relationships");
  });
});
