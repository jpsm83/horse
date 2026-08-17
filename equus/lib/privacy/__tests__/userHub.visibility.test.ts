/**
 * getUserHub — L1 profileVisibility gating + L2 hub-section filtering + entities.
 */

import { describe, expect, it, vi } from "vitest";

import {
  getUserHub,
  type PublicUserProfileRequester,
} from "@/lib/privacy/userPublicProfile.ts";
import * as userService from "@/lib/services/userService.ts";
import * as horseService from "@/lib/services/horseService.ts";

vi.mock("@/lib/email/sendStaffInviteEmail.ts", () => ({
  sendStaffInviteEmail: vi.fn().mockResolvedValue(undefined),
}));

async function createTargetUser(
  email: string,
  profileVisibility: "public" | "platform" | "relationships" | "private" = "public",
) {
  const user = await userService.createCredentialsUser({
    email,
    password: "TestPass1!",
    firstName: "Ada",
    lastName: "Lovelace",
  });

  if (profileVisibility !== "public") {
    await userService.updatePersonalDetails(String(user._id), {
      preferences: { profileVisibility },
    });
  }

  return user;
}

describe("getUserHub", () => {
  it("404s for an anonymous requester when profileVisibility is platform", async () => {
    const target = await createTargetUser("hub-l1-platform@example.com", "platform");
    await expect(
      getUserHub(String(target._id), { isAuthenticated: false }),
    ).rejects.toMatchObject({ statusCode: 404 });
  });

  it("gates contact by L2 relationship mode for public vs self", async () => {
    const target = await createTargetUser("hub-l2-contact@example.com");

    const publicSections = await getUserHub(String(target._id), {
      isAuthenticated: false,
    });
    expect(publicSections.identity).toBeDefined();
    expect(publicSections.identification).toBeUndefined();
    expect(publicSections.address).toBeUndefined();
    expect(publicSections.contact).toBeUndefined();

    const selfRequester: PublicUserProfileRequester = {
      id: String(target._id),
      isAuthenticated: true,
    };
    const selfSections = await getUserHub(String(target._id), selfRequester);
    expect(selfSections.contact?.email).toBeTruthy();
    expect(selfSections.identification).toBeDefined();
    expect(selfSections.address).toBeDefined();
    expect(selfSections.identity?.firstName).toBe("Ada");
  });

  it("lists the owner's horses in entities for the owner", async () => {
    const owner = await createTargetUser("hub-entities@example.com");
    await horseService.createHorse(String(owner._id), {
      name: "Comet",
      breed: "Lusitano",
      sex: "Gelding",
      countryOfBirth: "US",
    });

    const selfRequester: PublicUserProfileRequester = {
      id: String(owner._id),
      isAuthenticated: true,
    };
    const sections = await getUserHub(String(owner._id), selfRequester);
    expect(sections.entities?.entities.some((e) => e.name === "Comet")).toBe(true);
  });

  it("hides non-public horses from public viewers in entities", async () => {
    const owner = await createTargetUser("hub-entities-private@example.com");
    const horse = await horseService.createHorse(String(owner._id), {
      name: "Shadow",
      breed: "Arabian",
      sex: "Stallion",
      countryOfBirth: "US",
    });
    await horseService.updateHorseDiscovery(String(owner._id), String(horse._id), {
      profileVisibility: "owner",
    });

    const publicSections = await getUserHub(String(owner._id), {
      isAuthenticated: false,
    });
    expect(publicSections.entities?.entities.some((e) => e.name === "Shadow")).toBe(false);
  });
});
