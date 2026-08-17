/**
 * @vitest-environment jsdom
 */
import * as React from "react";
import { act } from "react";
import { createElement } from "react";
import { createRoot, type Root } from "react-dom/client";
import { describe, expect, it, vi } from "vitest";

import { OwnershipTransfersContent } from "@/components/invites/ownership-transfers-content.tsx";

const translationMap: Record<string, string> = {
  "invites.ownershipTransfers.title": "Ownership transfer requests",
  "invites.ownershipTransfers.description": "Pending ownership changes waiting for your response.",
  "invites.ownershipTransfers.empty": "You have no pending ownership transfer requests.",
  "invites.ownershipTransfers.accept": "Accept",
  "invites.ownershipTransfers.decline": "Decline",
  "invites.ownershipTransfers.loadFailed": "Failed to load ownership transfer requests.",
  "invites.ownershipTransfers.entityTypes.horse": "Horse",
  "invites.ownershipTransfers.entityTypes.stable": "Stable",
  "invites.ownershipTransfers.transferKinds.transfer_main": "Transfer main ownership",
  "common.home": "Home",
  "common.from": "from {label}",
  "status.requestFailed": "Request failed.",
};

const authState = vi.hoisted(() => ({
  isAuthenticated: false,
  isLoading: false,
}));

const transferState = vi.hoisted(() => ({
  data: null as Array<{
    id: string;
    entityName?: string;
    entityType: string;
    transferKind: string;
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

vi.mock("@/hooks/queries/useAuthData.ts", () => ({
  usePendingOwnershipTransfers: () => ({ data: transferState.data, isPending: transferState.isPending }),
}));

vi.mock("@/hooks/queries/useOwnershipTransfer.ts", () => ({
  useAcceptOwnershipTransfer: () => ({ isPending: false, mutateAsync: vi.fn(async () => {}) }),
  useDeclineOwnershipTransfer: () => ({ isPending: false, mutateAsync: vi.fn(async () => {}) }),
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

describe("OwnershipTransfersContent", () => {
  it("shows the empty state when no pending transfers", () => {
    authState.isAuthenticated = true;
    authState.isLoading = false;
    transferState.data = [];
    transferState.isPending = false;
    const m = mount(createElement(OwnershipTransfersContent, { highlightTransferId: null }));
    expect(m.container.textContent ?? "").toContain(
      "You have no pending ownership transfer requests.",
    );
    unmount(m);
  });

  it("renders pending transfer cards with entity, kind, and buttons", () => {
    authState.isAuthenticated = true;
    authState.isLoading = false;
    transferState.data = [
      {
        id: "t1",
        entityName: "Comet",
        entityType: "horse",
        transferKind: "transfer_main",
        initiatorLabel: "Ada",
      },
    ];
    transferState.isPending = false;
    const m = mount(createElement(OwnershipTransfersContent, { highlightTransferId: null }));
    const text = m.container.textContent ?? "";
    expect(text).toContain("Comet");
    expect(text).toContain("Transfer main ownership");
    expect(text).toContain("Ada");
    expect(text).toContain("Accept");
    expect(text).toContain("Decline");
    unmount(m);
  });

  it("shows a skeleton while loading", () => {
    authState.isAuthenticated = true;
    authState.isLoading = true;
    transferState.isPending = false;
    const m = mount(createElement(OwnershipTransfersContent, { highlightTransferId: null }));
    expect(m.container.querySelector('[data-slot="spinner"]')).toBeTruthy();
    unmount(m);
  });
});
