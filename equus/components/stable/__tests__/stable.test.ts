/**
 * @vitest-environment jsdom
 */
import * as React from "react";
import { act } from "react";
import { createElement } from "react";
import { createRoot, type Root } from "react-dom/client";
import { describe, expect, it, vi } from "vitest";
import type { ComponentType } from "react";

import { StablePageContentSkeleton } from "@/components/stable/stable-page-content-skeleton.tsx";
import { StableHubHero } from "@/components/stable/hub/stable-hub-hero.tsx";
import { StablePageShell } from "@/components/stable/stable-page-shell.tsx";

const translationMap: Record<string, string> = {
  "stable.hub.about": "About",
  "stable.hub.contact": "Contact",
  "stable.hub.disciplines": "Disciplines",
  "stable.hub.services": "Services",
  "stable.hub.acceptsNewHorses": "Accepting new horses",
  "stable.hub.email": "Email",
  "stable.hub.phone": "Phone",
  "stable.hub.website": "Website",
  "stable.hub.loadFailed": "Failed to load this stable.",
  "common.permissionDenied": "You don't have permission to view this page.",
  "common.backToHub": "Back to hub",
};

const authState = vi.hoisted(() => ({
  user: null as { id: string; email: string } | null,
  isAuthenticated: false,
  isLoading: false,
}));

const viewState = vi.hoisted(() => ({
  data: null as unknown,
  isLoading: false,
}));

vi.mock("next-intl", () => ({
  useTranslations: (namespace: string) => (key: string) =>
    translationMap[`${namespace}.${key}`] ?? key,
}));

vi.mock("@/i18n/navigation.ts", () => ({
  useRouter: () => ({ replace: vi.fn(), push: vi.fn() }),
  Link: ({ href, children }: { href: string; children: React.ReactNode }) =>
    createElement("a", { href }, children),
}));

vi.mock("@/hooks/use-app-auth.ts", () => ({
  useAppAuth: () => ({
    user: authState.user,
    isAuthenticated: authState.isAuthenticated,
    isLoading: authState.isLoading,
    logout: async () => {},
  }),
}));

vi.mock("@/hooks/queries/useStable.ts", () => ({
  useStableView: () => ({ data: viewState.data, isLoading: viewState.isLoading }),
}));

// children passed as positional createElement arg (React-first); cast keeps TS
// from requiring children in the props object.
const Shell = StablePageShell as ComponentType<{ stableId: string }>;

const STABLE_VIEW = {
  viewerRole: "main_owner",
  allowedTabs: ["hub", "profile", "admin"],
  stable: {
    id: "s1",
    tradeName: "Sunrise Stable",
    description: "Full-service boarding stable.",
    email: "contact@sunrise.test",
    phoneNumber: "+123",
    address: { city: "Lexington", country: "US" },
    disciplines: ["Jumping"],
    services: ["boarding"],
    acceptsNewHorses: true,
    isMainOwner: true,
    isAdmin: true,
  },
};

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

describe("StablePageContentSkeleton", () => {
  it("renders a skeleton container with a spinner by default", () => {
    const m = mount(createElement(StablePageContentSkeleton));
    expect(m.container.querySelector('[data-slot="spinner"]')).toBeTruthy();
    expect(m.container.querySelector(".relative.w-full.h-full")).toBeTruthy();
    unmount(m);
  });

  it("hides the spinner when showSpinner is false", () => {
    const m = mount(createElement(StablePageContentSkeleton, { showSpinner: false }));
    expect(m.container.querySelector('[data-slot="spinner"]')).toBeNull();
    unmount(m);
  });
});

describe("StableHubHero", () => {
  it("renders trade name, location, and description", () => {
    const m = mount(createElement(StableHubHero, { stable: STABLE_VIEW.stable }));
    const text = m.container.textContent ?? "";
    expect(text).toContain("Sunrise Stable");
    expect(text).toContain("Lexington, US");
    expect(text).toContain("Full-service boarding stable.");
    unmount(m);
  });
});

describe("StablePageShell", () => {
  it("shows a skeleton while loading", () => {
    authState.user = null;
    authState.isAuthenticated = false;
    authState.isLoading = true;
    viewState.isLoading = false;
    viewState.data = null;
    const m = mount(
      createElement(Shell, { stableId: "s1" }, createElement("p", null, "Content")),
    );
    expect(m.container.querySelector('[data-slot="spinner"]')).toBeTruthy();
    unmount(m);
  });

  it("shows a skeleton for an unauthenticated user (redirect handled by effect)", () => {
    authState.user = null;
    authState.isAuthenticated = false;
    authState.isLoading = false;
    viewState.data = STABLE_VIEW;
    const m = mount(
      createElement(Shell, { stableId: "s1" }, createElement("p", null, "Content")),
    );
    expect(m.container.textContent ?? "").not.toContain("Content");
    unmount(m);
  });

  it("renders children for an authenticated main owner", () => {
    authState.user = { id: "u1", email: "a@b.c" };
    authState.isAuthenticated = true;
    authState.isLoading = false;
    viewState.data = STABLE_VIEW;
    const m = mount(
      createElement(Shell, { stableId: "s1" }, createElement("p", null, "Content")),
    );
    expect(m.container.textContent ?? "").toContain("Content");
    unmount(m);
  });
});
