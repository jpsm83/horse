/**
 * @vitest-environment jsdom
 */
import * as React from "react";
import { act } from "react";
import { createElement } from "react";
import { createRoot, type Root } from "react-dom/client";
import { describe, expect, it, vi } from "vitest";
import type { ComponentType } from "react";

import { TransportPageContentSkeleton } from "@/components/transport/transport-page-content-skeleton.tsx";
import { TransportHubHero } from "@/components/transport/hub/transport-hub-hero.tsx";
import { TransportPageShell } from "@/components/transport/transport-page-shell.tsx";

const translationMap: Record<string, string> = {
  "transport.hub.about": "About",
  "transport.hub.contact": "Contact",
  "transport.hub.specialties": "Specialties",
  "transport.hub.serviceAreas": "Service areas",
  "transport.hub.acceptsNewBookings": "Accepting new bookings",
  "transport.hub.email": "Email",
  "transport.hub.phone": "Phone",
  "transport.hub.emergencyPhone": "Emergency phone",
  "transport.hub.loadFailed": "Failed to load this transport company.",
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

vi.mock("@/hooks/queries/useTransport.ts", () => ({
  useTransportView: () => ({ data: viewState.data, isLoading: viewState.isLoading }),
}));

// children passed as positional createElement arg (React-first); cast keeps TS
// from requiring children in the props object.
const Shell = TransportPageShell as ComponentType<{ transportId: string }>;

const TRANSPORT_VIEW = {
  viewerRole: "main_owner",
  allowedTabs: ["hub", "profile", "admin"],
  transport: {
    id: "t1",
    companyName: "Equine Haulers",
    description: "Professional horse transport.",
    email: "haul@example.com",
    phoneNumber: "+123",
    emergencyPhoneNumber: "+999",
    address: { city: "Lisbon", country: "Portugal" },
    specialties: ["long_distance"],
    serviceAreas: ["Lisbon"],
    acceptsNewBookings: true,
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

describe("TransportPageContentSkeleton", () => {
  it("renders a skeleton container with a spinner by default", () => {
    const m = mount(createElement(TransportPageContentSkeleton));
    expect(m.container.querySelector('[data-slot="spinner"]')).toBeTruthy();
    expect(m.container.querySelector(".relative.w-full.h-full")).toBeTruthy();
    unmount(m);
  });

  it("hides the spinner when showSpinner is false", () => {
    const m = mount(createElement(TransportPageContentSkeleton, { showSpinner: false }));
    expect(m.container.querySelector('[data-slot="spinner"]')).toBeNull();
    unmount(m);
  });
});

describe("TransportHubHero", () => {
  it("renders company name, location, and description", () => {
    const m = mount(createElement(TransportHubHero, { transport: TRANSPORT_VIEW.transport }));
    const text = m.container.textContent ?? "";
    expect(text).toContain("Equine Haulers");
    expect(text).toContain("Lisbon, Portugal");
    expect(text).toContain("Professional horse transport.");
    unmount(m);
  });
});

describe("TransportPageShell", () => {
  it("shows a skeleton while loading", () => {
    authState.user = null;
    authState.isAuthenticated = false;
    authState.isLoading = true;
    viewState.isLoading = false;
    viewState.data = null;
    const m = mount(
      createElement(Shell, { transportId: "t1" }, createElement("p", null, "Content")),
    );
    expect(m.container.querySelector('[data-slot="spinner"]')).toBeTruthy();
    unmount(m);
  });

  it("shows a skeleton for an unauthenticated user (redirect handled by effect)", () => {
    authState.user = null;
    authState.isAuthenticated = false;
    authState.isLoading = false;
    viewState.data = TRANSPORT_VIEW;
    const m = mount(
      createElement(Shell, { transportId: "t1" }, createElement("p", null, "Content")),
    );
    expect(m.container.textContent ?? "").not.toContain("Content");
    unmount(m);
  });

  it("renders children for an authenticated main owner", () => {
    authState.user = { id: "u1", email: "a@b.c" };
    authState.isAuthenticated = true;
    authState.isLoading = false;
    viewState.data = TRANSPORT_VIEW;
    const m = mount(
      createElement(Shell, { transportId: "t1" }, createElement("p", null, "Content")),
    );
    expect(m.container.textContent ?? "").toContain("Content");
    unmount(m);
  });
});
