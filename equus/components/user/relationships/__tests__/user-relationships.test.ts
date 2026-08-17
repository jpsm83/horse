/**
 * @vitest-environment jsdom
 */
import * as React from "react";
import { act } from "react";
import { createElement } from "react";
import { createRoot, type Root } from "react-dom/client";
import { describe, expect, it, vi } from "vitest";

import { UserRelationshipRequestsSection } from "@/components/user/relationships/user-relationship-requests-section.tsx";
import { UserRelationshipListSection } from "@/components/user/relationships/user-relationship-list-section.tsx";

const translationMap: Record<string, string> = {
  "userRelationships.noRequests": "No pending relationship requests.",
  "userRelationships.unknownHorse": "Unknown horse",
  "userRelationships.fromLabel": "From",
  "userRelationships.accept": "Accept",
  "userRelationships.decline": "Decline",
  "userRelationships.requestAccepted": "Request accepted.",
  "userRelationships.requestDeclined": "Request declined.",
  "userRelationships.requestAcceptFailed": "Could not accept.",
  "userRelationships.requestDeclineFailed": "Could not decline.",
  "userRelationships.listComingSoon": "Your active relationships will appear here soon.",
};

const relationshipsState = vi.hoisted(() => ({
  data: null as Array<{
    id: string;
    status: string;
    horseName?: string;
    relationshipType: string;
    requesterLabel?: string;
  }> | null,
  isPending: false,
}));

vi.mock("next-intl", () => ({
  useTranslations: (namespace: string) => (key: string) =>
    translationMap[`${namespace}.${key}`] ?? key,
}));

vi.mock("@/hooks/queries", () => ({
  usePendingRelationships: () => ({ data: relationshipsState.data, isPending: relationshipsState.isPending }),
  useAcceptRelationship: () => ({ isPending: false, mutateAsync: vi.fn(async () => {}) }),
  useDeclineRelationship: () => ({ isPending: false, mutateAsync: vi.fn(async () => {}) }),
}));

vi.mock("@/hooks/use-app-toast.ts", () => ({
  useAppToast: () => ({ success: vi.fn(), error: vi.fn(), info: vi.fn() }),
}));

type Mount = { container: HTMLDivElement; root: Root };

function mount(ui: React.ReactElement): Mount {
  const container = document.createElement("div");
  document.body.appendChild(container);
  const root = createRoot(container);
  act(() => {
    root.render(ui);
  });
  return { container, root };
}

function unmount(m: Mount): void {
  act(() => {
    m.root.unmount();
  });
  m.container.remove();
}

describe("UserRelationshipRequestsSection", () => {
  it("shows the empty state when no pending requests", () => {
    relationshipsState.data = [];
    relationshipsState.isPending = false;
    const m = mount(createElement(UserRelationshipRequestsSection));
    expect(m.container.textContent ?? "").toContain("No pending relationship requests.");
    unmount(m);
  });

  it("renders pending requests with horse, type, requester, and accept/decline buttons", () => {
    relationshipsState.data = [
      {
        id: "rel1",
        status: "pending",
        horseName: "Comet",
        relationshipType: "veterinary",
        requesterLabel: "Dr. Lee",
      },
    ];
    relationshipsState.isPending = false;
    const m = mount(createElement(UserRelationshipRequestsSection));
    const text = m.container.textContent ?? "";
    expect(text).toContain("Comet");
    expect(text).toContain("veterinary");
    expect(text).toContain("Dr. Lee");
    expect(text).toContain("Accept");
    expect(text).toContain("Decline");
    unmount(m);
  });
});

describe("UserRelationshipListSection", () => {
  it("renders the active relationships placeholder", () => {
    const m = mount(createElement(UserRelationshipListSection));
    expect(m.container.textContent ?? "").toContain(
      "Your active relationships will appear here soon.",
    );
    unmount(m);
  });
});
