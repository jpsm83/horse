/**
 * @vitest-environment jsdom
 */
import * as React from "react";
import { act } from "react";
import { createElement } from "react";
import { createRoot, type Root } from "react-dom/client";
import { describe, expect, it, vi } from "vitest";

import { RelationshipsContent } from "@/components/invites/relationships-content.tsx";

const translationMap: Record<string, string> = {
  "invites.relationships.title": "Relationship invitations",
  "invites.relationships.description": "Pending horse relationship requests waiting for your response.",
  "invites.relationships.empty": "You have no pending relationship invitations.",
  "invites.relationships.accept": "Accept",
  "invites.relationships.decline": "Decline",
  "invites.relationships.loadFailed": "Failed to load relationship requests.",
  "common.home": "Home",
  "common.horseFallback": "Horse",
  "common.from": "from {label}",
  "status.requestFailed": "Request failed.",
};

const authState = vi.hoisted(() => ({
  isAuthenticated: false,
  isLoading: false,
}));

const relState = vi.hoisted(() => ({
  data: null as Array<{
    id: string;
    horseName?: string;
    relationshipType: string;
    requesterLabel?: string;
  }> | null,
  isPending: false,
}));

vi.mock("next-intl", () => ({
  useTranslations: (namespace: string) => (key: string, values?: Record<string, string>) => {
    let value = translationMap[`${namespace}.${key}`] ?? key;
    if (values) {
      for (const [k, v] of Object.entries(values)) {
        value = value.replace(`{${k}}`, v);
      }
    }
    return value;
  },
}));

vi.mock("@/i18n/navigation.ts", () => ({
  useRouter: () => ({ replace: vi.fn(), push: vi.fn() }),
}));

vi.mock("@/components/navigation/app-home-link.tsx", () => ({
  AppHomeLink: ({ children }: { children: React.ReactNode }) => createElement("span", null, children),
}));

vi.mock("@/hooks/use-app-auth.ts", () => ({
  useAppAuth: () => ({
    user: null,
    isAuthenticated: authState.isAuthenticated,
    isLoading: authState.isLoading,
    logout: async () => {},
  }),
}));

vi.mock("@/hooks/queries/useAuthData.ts", () => ({
  usePendingRelationships: () => ({ data: relState.data, isPending: relState.isPending }),
}));

vi.mock("@/hooks/queries/useRelationship.ts", () => ({
  useAcceptRelationship: () => ({ isPending: false, mutateAsync: vi.fn(async () => {}) }),
  useDeclineRelationship: () => ({ isPending: false, mutateAsync: vi.fn(async () => {}) }),
}));

vi.mock("@/hooks/use-app-toast.ts", () => ({
  useAppToast: () => ({ success: vi.fn(), error: vi.fn(), info: vi.fn() }),
}));

vi.mock("@/lib/api/auth/session.ts", () => ({
  isApiClientError: vi.fn(() => false),
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

describe("RelationshipsContent", () => {
  it("shows the empty state when no pending relationships", () => {
    authState.isAuthenticated = true;
    authState.isLoading = false;
    relState.data = [];
    relState.isPending = false;
    const m = mount(createElement(RelationshipsContent, { highlightRelationshipId: null }));
    expect(m.container.textContent ?? "").toContain("You have no pending relationship invitations.");
    unmount(m);
  });

  it("renders pending relationship cards with horse, type, and buttons", () => {
    authState.isAuthenticated = true;
    authState.isLoading = false;
    relState.data = [
      { id: "rel1", horseName: "Comet", relationshipType: "veterinary", requesterLabel: "Dr. Lee" },
    ];
    relState.isPending = false;
    const m = mount(createElement(RelationshipsContent, { highlightRelationshipId: null }));
    const text = m.container.textContent ?? "";
    expect(text).toContain("Comet");
    expect(text).toContain("veterinary");
    expect(text).toContain("Dr. Lee");
    expect(text).toContain("Accept");
    expect(text).toContain("Decline");
    unmount(m);
  });

  it("shows a skeleton while loading", () => {
    authState.isAuthenticated = true;
    authState.isLoading = true;
    relState.isPending = false;
    const m = mount(createElement(RelationshipsContent, { highlightRelationshipId: null }));
    expect(m.container.querySelector('[data-slot="spinner"]')).toBeTruthy();
    unmount(m);
  });
});
