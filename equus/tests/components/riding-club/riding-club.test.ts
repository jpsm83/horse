/**
 * @vitest-environment jsdom
 */
import * as React from "react";
import { act } from "react";
import { createElement } from "react";
import { createRoot, type Root } from "react-dom/client";
import { describe, expect, it, vi } from "vitest";
import type { ComponentType } from "react";

import { RidingClubPageContentSkeleton } from "@/components/riding-club/riding-club-page-content-skeleton.tsx";
import { RidingClubHubHero } from "@/components/riding-club/hub/riding-club-hub-hero.tsx";
import { RidingClubPageShell } from "@/components/riding-club/riding-club-page-shell.tsx";

const translationMap: Record<string, string> = {
  "ridingClub.hub.title": "Riding club",
  "ridingClub.hub.loadFailed": "Failed to load this riding club.",
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

vi.mock("@/hooks/queries/useRidingClub.ts", () => ({
  useRidingClubView: () => ({ data: viewState.data, isLoading: viewState.isLoading }),
}));

// children passed as positional createElement arg (React-first); cast keeps TS
// from requiring children in the props object.
const Shell = RidingClubPageShell as ComponentType<{ clubId: string }>;

const RIDING_CLUB_VIEW = {
  viewerRole: "main_owner",
  allowedTabs: ["hub", "profile", "admin"],
  ridingClub: {
    id: "c1",
    clubName: "Equestrian Heights Club",
    description: "Competition and leisure riding club.",
    email: "contact@heights.test",
    phoneNumber: "+123",
    address: { city: "Lexington", country: "US" },
    disciplines: ["Jumping"],
    facilities: ["Indoor arena"],
    acceptsNewMembers: true,
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

describe("RidingClubPageContentSkeleton", () => {
  it("renders a skeleton container with a spinner by default", () => {
    const m = mount(createElement(RidingClubPageContentSkeleton));
    expect(m.container.querySelector('[data-slot="spinner"]')).toBeTruthy();
    expect(m.container.querySelector(".relative.w-full.h-full")).toBeTruthy();
    unmount(m);
  });

  it("hides the spinner when showSpinner is false", () => {
    const m = mount(createElement(RidingClubPageContentSkeleton, { showSpinner: false }));
    expect(m.container.querySelector('[data-slot="spinner"]')).toBeNull();
    unmount(m);
  });
});

describe("RidingClubHubHero", () => {
  it("renders club name, location, and description", () => {
    const m = mount(createElement(RidingClubHubHero, { ridingClub: RIDING_CLUB_VIEW.ridingClub }));
    const text = m.container.textContent ?? "";
    expect(text).toContain("Equestrian Heights Club");
    expect(text).toContain("Lexington, US");
    expect(text).toContain("Competition and leisure riding club.");
    unmount(m);
  });
});

describe("RidingClubPageShell", () => {
  it("shows a skeleton while loading", () => {
    authState.user = null;
    authState.isAuthenticated = false;
    authState.isLoading = true;
    viewState.isLoading = false;
    viewState.data = null;
    const m = mount(
      createElement(Shell, { clubId: "c1" }, createElement("p", null, "Content")),
    );
    expect(m.container.querySelector('[data-slot="spinner"]')).toBeTruthy();
    unmount(m);
  });

  it("shows a skeleton for an unauthenticated user (redirect handled by effect)", () => {
    authState.user = null;
    authState.isAuthenticated = false;
    authState.isLoading = false;
    viewState.data = RIDING_CLUB_VIEW;
    const m = mount(
      createElement(Shell, { clubId: "c1" }, createElement("p", null, "Content")),
    );
    expect(m.container.textContent ?? "").not.toContain("Content");
    unmount(m);
  });

  it("renders children for an authenticated main owner", () => {
    authState.user = { id: "u1", email: "a@b.c" };
    authState.isAuthenticated = true;
    authState.isLoading = false;
    viewState.data = RIDING_CLUB_VIEW;
    const m = mount(
      createElement(Shell, { clubId: "c1" }, createElement("p", null, "Content")),
    );
    expect(m.container.textContent ?? "").toContain("Content");
    unmount(m);
  });
});
