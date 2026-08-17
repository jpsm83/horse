/**
 * @vitest-environment jsdom
 */
import * as React from "react";
import { act } from "react";
import { createElement } from "react";
import { createRoot, type Root } from "react-dom/client";
import { describe, expect, it, vi } from "vitest";
import type { ComponentType } from "react";

import { VeterinaryPageContentSkeleton } from "@/components/veterinary/veterinary-page-content-skeleton.tsx";
import { VeterinaryHubAbout } from "@/components/veterinary/hub/veterinary-hub-about.tsx";
import { VeterinaryHubHero } from "@/components/veterinary/hub/veterinary-hub-hero.tsx";
import { VeterinaryPageShell } from "@/components/veterinary/veterinary-page-shell.tsx";

const translationMap: Record<string, string> = {
  "veterinary.hub.about": "About",
  "veterinary.hub.contact": "Contact",
  "veterinary.hub.emergencyAvailability": "Emergency availability",
  "veterinary.hub.email": "Email",
  "veterinary.hub.phone": "Phone",
  "veterinary.hub.emergencyPhone": "Emergency phone",
  "veterinary.hub.loadFailed": "Failed to load this veterinary practice.",
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

vi.mock("@/hooks/queries/useVeterinary.ts", () => ({
  useVeterinaryView: () => ({ data: viewState.data, isLoading: viewState.isLoading }),
}));

// children passed as positional createElement arg (React-first); cast keeps TS
// from requiring children in the props object.
const Shell = VeterinaryPageShell as ComponentType<{ veterinaryId: string }>;

const VETERINARY_VIEW = {
  viewerRole: "owner",
  allowedTabs: ["hub", "profile"],
  veterinary: {
    id: "v1",
    practiceName: "Bluegrass Equine Clinic",
    description: "Full-service equine hospital.",
    email: "care@bluegrass.test",
    phoneNumber: "+123",
    emergencyPhoneNumber: "+999",
    address: { city: "Lexington", country: "US" },
    serviceAreaKm: 50,
    emergencyAvailability: true,
    acceptsNewPatients: true,
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

describe("VeterinaryPageContentSkeleton", () => {
  it("renders a skeleton container with a spinner by default", () => {
    const m = mount(createElement(VeterinaryPageContentSkeleton));
    expect(m.container.querySelector('[data-slot="spinner"]')).toBeTruthy();
    expect(m.container.querySelector(".relative.w-full.h-full")).toBeTruthy();
    unmount(m);
  });

  it("hides the spinner when showSpinner is false", () => {
    const m = mount(createElement(VeterinaryPageContentSkeleton, { showSpinner: false }));
    expect(m.container.querySelector('[data-slot="spinner"]')).toBeNull();
    unmount(m);
  });
});

describe("VeterinaryHubHero", () => {
  it("renders practice name and location", () => {
    const m = mount(createElement(VeterinaryHubHero, { veterinary: VETERINARY_VIEW.veterinary }));
    const text = m.container.textContent ?? "";
    expect(text).toContain("Bluegrass Equine Clinic");
    expect(text).toContain("Lexington, US");
    unmount(m);
  });
});

describe("VeterinaryHubAbout", () => {
  it("renders description and emergency availability", () => {
    const m = mount(createElement(VeterinaryHubAbout, { veterinary: VETERINARY_VIEW.veterinary }));
    const text = m.container.textContent ?? "";
    expect(text).toContain("Full-service equine hospital.");
    expect(text).toContain("Emergency availability");
    unmount(m);
  });
});

describe("VeterinaryPageShell", () => {
  it("shows a skeleton while loading", () => {
    authState.user = null;
    authState.isAuthenticated = false;
    authState.isLoading = true;
    viewState.isLoading = false;
    viewState.data = null;
    const m = mount(
      createElement(Shell, { veterinaryId: "v1" }, createElement("p", null, "Content")),
    );
    expect(m.container.querySelector('[data-slot="spinner"]')).toBeTruthy();
    unmount(m);
  });

  it("shows a skeleton for an unauthenticated user (redirect handled by effect)", () => {
    authState.user = null;
    authState.isAuthenticated = false;
    authState.isLoading = false;
    viewState.data = VETERINARY_VIEW;
    const m = mount(
      createElement(Shell, { veterinaryId: "v1" }, createElement("p", null, "Content")),
    );
    expect(m.container.textContent ?? "").not.toContain("Content");
    unmount(m);
  });

  it("renders children for an authenticated profile owner", () => {
    authState.user = { id: "u1", email: "a@b.c" };
    authState.isAuthenticated = true;
    authState.isLoading = false;
    viewState.data = VETERINARY_VIEW;
    const m = mount(
      createElement(Shell, { veterinaryId: "v1" }, createElement("p", null, "Content")),
    );
    expect(m.container.textContent ?? "").toContain("Content");
    unmount(m);
  });

  it("shows a permission denied block for a non-owner viewer", () => {
    authState.user = { id: "u2", email: "other@b.c" };
    authState.isAuthenticated = true;
    authState.isLoading = false;
    viewState.data = {
      ...VETERINARY_VIEW,
      veterinary: { ...VETERINARY_VIEW.veterinary, isOwner: false },
    };
    const m = mount(
      createElement(Shell, { veterinaryId: "v1" }, createElement("p", null, "Content")),
    );
    expect(m.container.textContent ?? "").toContain("You don't have permission to view this page.");
    expect(m.container.textContent ?? "").not.toContain("Content");
    unmount(m);
  });
});
