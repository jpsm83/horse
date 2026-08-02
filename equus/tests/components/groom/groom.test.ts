/**
 * @vitest-environment jsdom
 */
import * as React from "react";
import { act } from "react";
import { createElement } from "react";
import { createRoot, type Root } from "react-dom/client";
import { describe, expect, it, vi } from "vitest";
import type { ComponentType } from "react";

import { GroomPageContentSkeleton } from "@/components/groom/groom-page-content-skeleton.tsx";
import { GroomHubHero } from "@/components/groom/hub/groom-hub-hero.tsx";
import { GroomPageShell } from "@/components/groom/groom-page-shell.tsx";

const translationMap: Record<string, string> = {
  "groom.hub.title": "Groom",
  "groom.hub.about": "About",
  "groom.hub.contact": "Contact",
  "groom.hub.specialties": "Specialties",
  "groom.hub.email": "Email",
  "groom.hub.phone": "Phone",
  "groom.hub.loadFailed": "Failed to load this groom.",
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

vi.mock("@/hooks/queries/useGroom.ts", () => ({
  useGroomView: () => ({ data: viewState.data, isLoading: viewState.isLoading }),
}));

// children passed as positional createElement arg (React-first); cast keeps TS
// from requiring children in the props object.
const Shell = GroomPageShell as ComponentType<{
  groomId: string;
  requireOwnership?: boolean;
}>;

const GROOM_VIEW = {
  viewerRole: "owner",
  allowedTabs: ["hub", "profile"],
  groom: {
    id: "g1",
    displayName: "Carla Groom",
    bio: "Professional barn groom.",
    email: "contact@carla.test",
    phoneNumber: "+123",
    address: { city: "Lexington", country: "US" },
    specialties: ["Turnout", "Clipping"],
    experienceYears: 5,
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

describe("GroomPageContentSkeleton", () => {
  it("renders a skeleton container with a spinner by default", () => {
    const m = mount(createElement(GroomPageContentSkeleton));
    expect(m.container.querySelector('[data-slot="spinner"]')).toBeTruthy();
    expect(m.container.querySelector(".relative.w-full.h-full")).toBeTruthy();
    unmount(m);
  });

  it("hides the spinner when showSpinner is false", () => {
    const m = mount(createElement(GroomPageContentSkeleton, { showSpinner: false }));
    expect(m.container.querySelector('[data-slot="spinner"]')).toBeNull();
    unmount(m);
  });
});

describe("GroomHubHero", () => {
  it("renders display name, location, and bio", () => {
    const m = mount(createElement(GroomHubHero, { groom: GROOM_VIEW.groom }));
    const text = m.container.textContent ?? "";
    expect(text).toContain("Carla Groom");
    expect(text).toContain("Lexington, US");
    expect(text).toContain("Professional barn groom.");
    unmount(m);
  });
});

describe("GroomPageShell", () => {
  it("shows a skeleton while loading", () => {
    authState.user = null;
    authState.isAuthenticated = false;
    authState.isLoading = true;
    viewState.isLoading = false;
    viewState.data = null;
    const m = mount(
      createElement(Shell, { groomId: "g1" }, createElement("p", null, "Content")),
    );
    expect(m.container.querySelector('[data-slot="spinner"]')).toBeTruthy();
    unmount(m);
  });

  it("shows a skeleton for an unauthenticated user (redirect handled by effect)", () => {
    authState.user = null;
    authState.isAuthenticated = false;
    authState.isLoading = false;
    viewState.data = GROOM_VIEW;
    const m = mount(
      createElement(Shell, { groomId: "g1" }, createElement("p", null, "Content")),
    );
    expect(m.container.textContent ?? "").not.toContain("Content");
    unmount(m);
  });

  it("renders children for an authenticated owner", () => {
    authState.user = { id: "u1", email: "a@b.c" };
    authState.isAuthenticated = true;
    authState.isLoading = false;
    viewState.data = GROOM_VIEW;
    const m = mount(
      createElement(Shell, { groomId: "g1" }, createElement("p", null, "Content")),
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
      groom: { ...GROOM_VIEW.groom, isOwner: false },
    };
    const m = mount(
      createElement(
        Shell,
        { groomId: "g1", requireOwnership: true },
        createElement("p", null, "Content"),
      ),
    );
    expect(m.container.textContent ?? "").not.toContain("Content");
    expect(m.container.textContent ?? "").toContain("You don't have permission to view this page.");
    unmount(m);
  });
});
