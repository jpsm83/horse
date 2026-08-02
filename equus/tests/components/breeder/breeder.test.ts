/**
 * @vitest-environment jsdom
 */
import * as React from "react";
import { act } from "react";
import { createElement } from "react";
import { createRoot, type Root } from "react-dom/client";
import { describe, expect, it, vi } from "vitest";
import type { ComponentType } from "react";

import { BreederPageContentSkeleton } from "@/components/breeder/breeder-page-content-skeleton.tsx";
import { BreederHubHero } from "@/components/breeder/hub/breeder-hub-hero.tsx";
import { BreederPageShell } from "@/components/breeder/breeder-page-shell.tsx";

const translationMap: Record<string, string> = {
  "breeder.hub.about": "About",
  "breeder.hub.contact": "Contact",
  "breeder.hub.disciplines": "Disciplines",
  "breeder.hub.bloodlines": "Bloodlines",
  "breeder.hub.email": "Email",
  "breeder.hub.phone": "Phone",
  "breeder.hub.title": "Breeder",
  "breeder.hub.loadFailed": "Failed to load this breeder.",
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

vi.mock("@/hooks/queries/useBreeder.ts", () => ({
  useBreederView: () => ({ data: viewState.data, isLoading: viewState.isLoading }),
}));

// children passed as positional createElement arg (React-first); cast keeps TS
// from requiring children in the props object.
const Shell = BreederPageShell as ComponentType<{ breederId: string }>;

const BREEDER_VIEW = {
  viewerRole: "main_owner",
  allowedTabs: ["hub", "profile", "admin"],
  breeder: {
    id: "b1",
    operationName: "Meadowbrook Farm",
    description: "Warmblood breeding program.",
    email: "contact@meadowbrook.test",
    phoneNumber: "+123",
    address: { city: "Lexington", country: "US" },
    disciplines: ["Breeding"],
    bloodlines: ["Northern Dancer"],
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

describe("BreederPageContentSkeleton", () => {
  it("renders a skeleton container with a spinner by default", () => {
    const m = mount(createElement(BreederPageContentSkeleton));
    expect(m.container.querySelector('[data-slot="spinner"]')).toBeTruthy();
    expect(m.container.querySelector(".relative.w-full.h-full")).toBeTruthy();
    unmount(m);
  });

  it("hides the spinner when showSpinner is false", () => {
    const m = mount(createElement(BreederPageContentSkeleton, { showSpinner: false }));
    expect(m.container.querySelector('[data-slot="spinner"]')).toBeNull();
    unmount(m);
  });
});

describe("BreederHubHero", () => {
  it("renders operation name, location, and description", () => {
    const m = mount(createElement(BreederHubHero, { breeder: BREEDER_VIEW.breeder }));
    const text = m.container.textContent ?? "";
    expect(text).toContain("Meadowbrook Farm");
    expect(text).toContain("Lexington, US");
    expect(text).toContain("Warmblood breeding program.");
    unmount(m);
  });
});

describe("BreederPageShell", () => {
  it("shows a skeleton while loading", () => {
    authState.user = null;
    authState.isAuthenticated = false;
    authState.isLoading = true;
    viewState.isLoading = false;
    viewState.data = null;
    const m = mount(
      createElement(Shell, { breederId: "b1" }, createElement("p", null, "Content")),
    );
    expect(m.container.querySelector('[data-slot="spinner"]')).toBeTruthy();
    unmount(m);
  });

  it("shows a skeleton for an unauthenticated user (redirect handled by effect)", () => {
    authState.user = null;
    authState.isAuthenticated = false;
    authState.isLoading = false;
    viewState.data = BREEDER_VIEW;
    const m = mount(
      createElement(Shell, { breederId: "b1" }, createElement("p", null, "Content")),
    );
    expect(m.container.textContent ?? "").not.toContain("Content");
    unmount(m);
  });

  it("renders children for an authenticated main owner", () => {
    authState.user = { id: "u1", email: "a@b.c" };
    authState.isAuthenticated = true;
    authState.isLoading = false;
    viewState.data = BREEDER_VIEW;
    const m = mount(
      createElement(Shell, { breederId: "b1" }, createElement("p", null, "Content")),
    );
    expect(m.container.textContent ?? "").toContain("Content");
    unmount(m);
  });
});
