import { describe, expect, it } from "vitest";

import { getStableTabs } from "@/lib/navigation/stableTabs.ts";

describe("getStableTabs", () => {
  it("shows hub only when allowedTabs is missing", () => {
    const tabs = getStableTabs("s1");

    expect(tabs).toEqual([{ id: "hub", label: "Hub", href: "/stables/s1" }]);
  });

  it("lists shipped profile tabs without ops modules", () => {
    const tabs = getStableTabs("s1", ["hub", "profile", "admin"]);

    expect(tabs.map((tab) => tab.id)).toEqual(["hub", "profile", "admin"]);
    expect(tabs.some((tab) => /roster|stall|whiteboard|finance/i.test(tab.id))).toBe(false);
    expect(tabs[1]?.href).toBe("/stables/s1/profile");
    expect(tabs[2]?.href).toBe("/stables/s1/admin");
  });
});
