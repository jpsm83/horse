/**
 * @vitest-environment jsdom
 */
import * as React from "react";
import { act } from "react";
import { createElement } from "react";
import { createRoot, type Root } from "react-dom/client";
import { describe, expect, it, vi } from "vitest";

import { PedigreeConnectionsContent } from "@/components/invites/pedigree-connections-content.tsx";

const translationMap: Record<string, string> = {
  "invites.pedigreeConnections.title": "Pedigree connection requests",
  "invites.pedigreeConnections.description": "Confirm that another horse is the offspring of your horse.",
  "invites.pedigreeConnections.empty": "You have no pending pedigree connection requests.",
  "invites.pedigreeConnections.accept": "Acknowledge",
  "invites.pedigreeConnections.decline": "Decline",
  "invites.pedigreeConnections.loadFailed": "Failed to load pedigree connection requests.",
  "invites.pedigreeConnections.roles.sire": "Sire",
  "invites.pedigreeConnections.roles.dam": "Dam",
  "invites.pedigreeConnections.childLine": "Requested for offspring: {childName}",
  "invites.pedigreeConnections.unknownParent": "Parent horse",
  "invites.pedigreeConnections.unknownChild": "Unknown horse",
  "invites.pedigreeConnections.ackHint": "Accepting only confirms the pedigree link.",
  "common.home": "Home",
  "common.from": "from {label}",
  "status.requestFailed": "Request failed.",
};

const authState = vi.hoisted(() => ({
  isAuthenticated: false,
  isLoading: false,
}));

const connState = vi.hoisted(() => ({
  data: null as Array<{
    id: string;
    role: string;
    parentHorseName?: string;
    childHorseName?: string;
    initiatorLabel?: string;
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

vi.mock("@/hooks/queries/usePedigreeConnection.ts", () => ({
  usePendingPedigreeConnections: () => ({ data: connState.data, isPending: connState.isPending }),
  useAcceptPedigreeConnection: () => ({ isPending: false, mutateAsync: vi.fn(async () => {}) }),
  useDeclinePedigreeConnection: () => ({ isPending: false, mutateAsync: vi.fn(async () => {}) }),
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

describe("PedigreeConnectionsContent", () => {
  it("shows the empty state when no pending connections", () => {
    authState.isAuthenticated = true;
    authState.isLoading = false;
    connState.data = [];
    connState.isPending = false;
    const m = mount(createElement(PedigreeConnectionsContent, { highlightConnectionId: null }));
    expect(m.container.textContent ?? "").toContain(
      "You have no pending pedigree connection requests.",
    );
    unmount(m);
  });

  it("renders pending connection cards with role, parent, and buttons", () => {
    authState.isAuthenticated = true;
    authState.isLoading = false;
    connState.data = [
      { id: "c1", role: "sire", parentHorseName: "Thunder", childHorseName: "Comet" },
    ];
    connState.isPending = false;
    const m = mount(createElement(PedigreeConnectionsContent, { highlightConnectionId: null }));
    const text = m.container.textContent ?? "";
    expect(text).toContain("Sire");
    expect(text).toContain("Thunder");
    expect(text).toContain("Comet");
    expect(text).toContain("Acknowledge");
    expect(text).toContain("Decline");
    unmount(m);
  });

  it("shows a skeleton while loading", () => {
    authState.isAuthenticated = true;
    authState.isLoading = true;
    connState.isPending = false;
    const m = mount(createElement(PedigreeConnectionsContent, { highlightConnectionId: null }));
    expect(m.container.querySelector('[data-slot="spinner"]')).toBeTruthy();
    unmount(m);
  });
});
