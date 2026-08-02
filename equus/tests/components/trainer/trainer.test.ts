/**
 * @vitest-environment jsdom
 */
import * as React from "react";
import { act } from "react";
import { createElement } from "react";
import { createRoot, type Root } from "react-dom/client";
import { describe, expect, it, vi } from "vitest";
import type { ComponentType } from "react";

import { TrainerPageContentSkeleton } from "@/components/trainer/trainer-page-content-skeleton.tsx";
import { TrainerHubHero } from "@/components/trainer/hub/trainer-hub-hero.tsx";
import { TrainerPageShell } from "@/components/trainer/trainer-page-shell.tsx";

const translationMap: Record<string, string> = {
  "trainer.hub.about": "About",
  "trainer.hub.contact": "Contact",
  "trainer.hub.specialties": "Specialties",
  "trainer.hub.email": "Email",
  "trainer.hub.phone": "Phone",
  "trainer.hub.loadFailed": "Failed to load this trainer.",
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

vi.mock("@/hooks/queries/useTrainer.ts", () => ({
  useTrainerView: () => ({ data: viewState.data, isLoading: viewState.isLoading }),
}));

// children passed as positional createElement arg (React-first); cast keeps TS
// from requiring children in the props object.
const Shell = TrainerPageShell as ComponentType<{ trainerId: string }>;

const TRAINER_VIEW = {
  viewerRole: "owner",
  allowedTabs: ["hub", "profile"],
  trainer: {
    id: "t1",
    displayName: "Ada Trainor",
    bio: "Equine dressage coach.",
    email: "ada@trainer.test",
    phoneNumber: "+123",
    address: { city: "Lexington", country: "US" },
    specialties: ["Dressage"],
    experienceYears: 12,
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

describe("TrainerPageContentSkeleton", () => {
  it("renders a skeleton container with a spinner by default", () => {
    const m = mount(createElement(TrainerPageContentSkeleton));
    expect(m.container.querySelector('[data-slot="spinner"]')).toBeTruthy();
    expect(m.container.querySelector(".relative.w-full.h-full")).toBeTruthy();
    unmount(m);
  });

  it("hides the spinner when showSpinner is false", () => {
    const m = mount(createElement(TrainerPageContentSkeleton, { showSpinner: false }));
    expect(m.container.querySelector('[data-slot="spinner"]')).toBeNull();
    unmount(m);
  });
});

describe("TrainerHubHero", () => {
  it("renders display name, location, and bio", () => {
    const m = mount(createElement(TrainerHubHero, { trainer: TRAINER_VIEW.trainer }));
    const text = m.container.textContent ?? "";
    expect(text).toContain("Ada Trainor");
    expect(text).toContain("Lexington, US");
    expect(text).toContain("Equine dressage coach.");
    unmount(m);
  });
});

describe("TrainerPageShell", () => {
  it("shows a skeleton while loading", () => {
    authState.user = null;
    authState.isAuthenticated = false;
    authState.isLoading = true;
    viewState.isLoading = false;
    viewState.data = null;
    const m = mount(
      createElement(Shell, { trainerId: "t1" }, createElement("p", null, "Content")),
    );
    expect(m.container.querySelector('[data-slot="spinner"]')).toBeTruthy();
    unmount(m);
  });

  it("shows a skeleton for an unauthenticated user (redirect handled by effect)", () => {
    authState.user = null;
    authState.isAuthenticated = false;
    authState.isLoading = false;
    viewState.data = TRAINER_VIEW;
    const m = mount(
      createElement(Shell, { trainerId: "t1" }, createElement("p", null, "Content")),
    );
    expect(m.container.textContent ?? "").not.toContain("Content");
    unmount(m);
  });

  it("renders children for an authenticated profile owner", () => {
    authState.user = { id: "u1", email: "a@b.c" };
    authState.isAuthenticated = true;
    authState.isLoading = false;
    viewState.data = TRAINER_VIEW;
    const m = mount(
      createElement(Shell, { trainerId: "t1" }, createElement("p", null, "Content")),
    );
    expect(m.container.textContent ?? "").toContain("Content");
    unmount(m);
  });

  it("shows a permission denied block for a non-owner viewer", () => {
    authState.user = { id: "u2", email: "other@b.c" };
    authState.isAuthenticated = true;
    authState.isLoading = false;
    viewState.data = {
      ...TRAINER_VIEW,
      trainer: { ...TRAINER_VIEW.trainer, isOwner: false },
    };
    const m = mount(
      createElement(Shell, { trainerId: "t1" }, createElement("p", null, "Content")),
    );
    expect(m.container.textContent ?? "").toContain("You don't have permission to view this page.");
    expect(m.container.textContent ?? "").not.toContain("Content");
    unmount(m);
  });
});
