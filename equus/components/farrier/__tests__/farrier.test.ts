/**
 * @vitest-environment jsdom
 */
import * as React from "react";
import { act } from "react";
import { createElement } from "react";
import { createRoot, type Root } from "react-dom/client";
import { describe, expect, it, vi } from "vitest";
import type { ComponentType } from "react";

import { FarrierPageContentSkeleton } from "@/components/farrier/farrier-page-content-skeleton.tsx";
import { FarrierHubHero } from "@/components/farrier/hub/farrier-hub-hero.tsx";
import { FarrierPageShell } from "@/components/farrier/farrier-page-shell.tsx";

const translationMap: Record<string, string> = {
  "farrier.hub.title": "Farrier",
  "farrier.hub.about": "About",
  "farrier.hub.contact": "Contact",
  "farrier.hub.email": "Email",
  "farrier.hub.phone": "Phone",
  "farrier.hub.loadFailed": "Failed to load this farrier.",
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

vi.mock("@/hooks/queries/useFarrier.ts", () => ({
  useFarrierView: () => ({ data: viewState.data, isLoading: viewState.isLoading }),
}));

// children passed as positional createElement arg (React-first); cast keeps TS
// from requiring children in the props object.
const Shell = FarrierPageShell as ComponentType<{
  farrierId: string;
  requireOwnership?: boolean;
}>;

const FARRIER_VIEW = {
  viewerRole: "owner",
  allowedTabs: ["hub", "profile"],
  farrier: {
    id: "f1",
    displayName: "Frank Farrier",
    bio: "Professional hoof care.",
    email: "contact@frank.test",
    phoneNumber: "+123",
    address: { city: "Lexington", country: "US" },
    experienceYears: 8,
    serviceAreaKm: 50,
    acceptsNewClients: true,
    isOwner: true,
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

describe("FarrierPageContentSkeleton", () => {
  it("renders a skeleton container with a spinner by default", () => {
    const m = mount(createElement(FarrierPageContentSkeleton));
    expect(m.container.querySelector('[data-slot="spinner"]')).toBeTruthy();
    expect(m.container.querySelector(".relative.w-full.h-full")).toBeTruthy();
    unmount(m);
  });

  it("hides the spinner when showSpinner is false", () => {
    const m = mount(createElement(FarrierPageContentSkeleton, { showSpinner: false }));
    expect(m.container.querySelector('[data-slot="spinner"]')).toBeNull();
    unmount(m);
  });
});

describe("FarrierHubHero", () => {
  it("renders display name, location, and bio", () => {
    const m = mount(createElement(FarrierHubHero, { farrier: FARRIER_VIEW.farrier }));
    const text = m.container.textContent ?? "";
    expect(text).toContain("Frank Farrier");
    expect(text).toContain("Lexington, US");
    expect(text).toContain("Professional hoof care.");
    unmount(m);
  });
});

describe("FarrierPageShell", () => {
  it("shows a skeleton while loading", () => {
    authState.user = null;
    authState.isAuthenticated = false;
    authState.isLoading = true;
    viewState.isLoading = false;
    viewState.data = null;
    const m = mount(
      createElement(Shell, { farrierId: "f1" }, createElement("p", null, "Content")),
    );
    expect(m.container.querySelector('[data-slot="spinner"]')).toBeTruthy();
    unmount(m);
  });

  it("shows a skeleton for an unauthenticated user (redirect handled by effect)", () => {
    authState.user = null;
    authState.isAuthenticated = false;
    authState.isLoading = false;
    viewState.data = FARRIER_VIEW;
    const m = mount(
      createElement(Shell, { farrierId: "f1" }, createElement("p", null, "Content")),
    );
    expect(m.container.textContent ?? "").not.toContain("Content");
    unmount(m);
  });

  it("renders children for an authenticated owner", () => {
    authState.user = { id: "u1", email: "a@b.c" };
    authState.isAuthenticated = true;
    authState.isLoading = false;
    viewState.data = FARRIER_VIEW;
    const m = mount(
      createElement(Shell, { farrierId: "f1" }, createElement("p", null, "Content")),
    );
    expect(m.container.textContent ?? "").toContain("Content");
    unmount(m);
  });

  it("blocks a non-owner with requireOwnership", () => {
    authState.user = { id: "u2", email: "other@b.c" };
    authState.isAuthenticated = true;
    authState.isLoading = false;
    viewState.data = {
      viewerRole: "public",
      allowedTabs: ["hub"],
      farrier: { ...FARRIER_VIEW.farrier, isOwner: false },
    };
    const m = mount(
      createElement(
        Shell,
        { farrierId: "f1", requireOwnership: true },
        createElement("p", null, "Content"),
      ),
    );
    expect(m.container.textContent ?? "").not.toContain("Content");
    expect(m.container.textContent ?? "").toContain("You don't have permission to view this page.");
    unmount(m);
  });
});
