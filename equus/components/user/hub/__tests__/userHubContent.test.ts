/**
 * @vitest-environment jsdom
 */
import * as React from "react";
import { act } from "react";
import { createElement } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { UserHubContent } from "@/components/user/hub/user-hub-content.tsx";
import type { UserHubSectionsProjection } from "@/lib/users/userHubSections.ts";

vi.mock("next-intl", () => ({
  useTranslations: () => (key: string) =>
    ({
      "sections.identification": "Identification",
      "sections.address": "Address",
      "sections.contact": "Contact",
      "sections.entities": "Horses & Entities",
      "identification.nationality": "Nationality",
      "identification.phone": "Phone",
      "identification.idType": "ID type",
      "identification.idNumber": "ID number",
      "address.location": "Location",
      "address.empty": "No address shared",
      "contact.empty": "No contact shared",
      noEntities: "No horses linked",
      anonymousMember: "Anonymous Member",
      businessBadge: "Business",
    })[key] ?? key,
}));

vi.mock("@/i18n/navigation.ts", () => ({
  Link: ({ href, children }: { href: string; children: React.ReactNode }) =>
    createElement("a", { href }, children),
}));

const SECTIONS: UserHubSectionsProjection = {
  identity: { firstName: "Ada", lastName: "Lovelace", username: "ada", bio: "Mathematician" },
  identification: { nationality: "GB", phoneNumber: "+123", idType: "Passport", idNumber: "X123" },
  address: { location: "London, GB" },
  contact: { email: "ada@example.com" },
  entities: {
    entities: [{ entityType: "horse", entityId: "h1", name: "Comet" }],
  },
};

describe("UserHubContent", () => {
  let container: HTMLDivElement;
  let root: Root;

  beforeEach(() => {
    (globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT =
      true;
    container = document.createElement("div");
    document.body.appendChild(container);
    root = createRoot(container);
  });

  afterEach(() => {
    act(() => {
      root.unmount();
    });
    container.remove();
  });

  it("renders the identity band and all present sections", () => {
    act(() => {
      root.render(createElement(UserHubContent, { sections: SECTIONS }));
    });

    const text = document.body.textContent ?? "";
    expect(text).toContain("Ada Lovelace");
    expect(text).toContain("@ada");
    expect(text).toContain("Mathematician");
    expect(text).toContain("ada@example.com");
    expect(text).toContain("+123");
    expect(text).toContain("London, GB");
    expect(text).toContain("Comet");
  });

  it("omits sections that are not present (server-filtered)", () => {
    act(() => {
      root.render(
        createElement(UserHubContent, {
          sections: { identity: SECTIONS.identity },
        }),
      );
    });

    const text = document.body.textContent ?? "";
    expect(text).toContain("Ada Lovelace");
    expect(text).not.toContain("ada@example.com");
    expect(text).not.toContain("+123");
    expect(text).not.toContain("Comet");
  });
});
