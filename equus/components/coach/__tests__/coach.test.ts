/**
 * @vitest-environment jsdom
 */
import * as React from "react";
import { act } from "react";
import { createElement } from "react";
import { createRoot, type Root } from "react-dom/client";
import { describe, expect, it, vi } from "vitest";
import type { ComponentType } from "react";

import { CoachPageContentSkeleton } from "@/components/coach/coach-page-content-skeleton.tsx";
import { CoachHubHero } from "@/components/coach/hub/coach-hub-hero.tsx";
import { CoachPageShell } from "@/components/coach/coach-page-shell.tsx";

const translationMap: Record<string, string> = {
  "coach.hub.title": "Coach",
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

vi.mock("@/hooks/queries/useCoach.ts", () => ({
  useCoachView: () => ({ data: viewState.data, isLoading: viewState.isLoading }),
}));

// children passed as positional createElement arg (React-first); cast keeps TS
// from requiring children in the props object.
const Shell = CoachPageShell as ComponentType<{ coachId: string; requireOwnership?: boolean }>;

const COACH_VIEW = {
  viewerRole: "owner",
  allowedTabs: ["hub", "profile"],
  coach: {
    id: "c1",
    displayName: "Elena Ruiz",
    bio: "Dressage coach with a national record.",
    email: "elena@coach.test",
    phoneNumber: "+123",
    address: { city: "Lexington", country: "US" },
    disciplines: ["Dressage"],
    competitionLevels: ["national"],
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

describe("CoachPageContentSkeleton", () => {
  it("renders a skeleton container with a spinner by default", () => {
    const m = mount(createElement(CoachPageContentSkeleton));
    expect(m.container.querySelector('[data-slot="spinner"]')).toBeTruthy();
    expect(m.container.querySelector(".relative.w-full.h-full")).toBeTruthy();
    unmount(m);
  });

  it("hides the spinner when showSpinner is false", () => {
    const m = mount(createElement(CoachPageContentSkeleton, { showSpinner: false }));
    expect(m.container.querySelector('[data-slot="spinner"]')).toBeNull();
    unmount(m);
  });
});

describe("CoachHubHero", () => {
  it("renders display name, location, and bio", () => {
    const m = mount(createElement(CoachHubHero, { coach: COACH_VIEW.coach }));
    const text = m.container.textContent ?? "";
    expect(text).toContain("Elena Ruiz");
    expect(text).toContain("Lexington, US");
    expect(text).toContain("Dressage coach with a national record.");
    unmount(m);
  });
});

describe("CoachPageShell", () => {
  it("shows a skeleton while loading", () => {
    authState.user = null;
    authState.isAuthenticated = false;
    authState.isLoading = true;
    viewState.isLoading = false;
    viewState.data = null;
    const m = mount(
      createElement(Shell, { coachId: "c1" }, createElement("p", null, "Content")),
    );
    expect(m.container.querySelector('[data-slot="spinner"]')).toBeTruthy();
    unmount(m);
  });

  it("shows a skeleton for an unauthenticated user (redirect handled by effect)", () => {
    authState.user = null;
    authState.isAuthenticated = false;
    authState.isLoading = false;
    viewState.data = COACH_VIEW;
    const m = mount(
      createElement(Shell, { coachId: "c1" }, createElement("p", null, "Content")),
    );
    expect(m.container.textContent ?? "").not.toContain("Content");
    unmount(m);
  });

  it("renders children for an authenticated owner (isOwner from the view DTO)", () => {
    authState.user = { id: "u1", email: "a@b.c" };
    authState.isAuthenticated = true;
    authState.isLoading = false;
    viewState.data = COACH_VIEW;
    const m = mount(
      createElement(Shell, { coachId: "c1" }, createElement("p", null, "Content")),
    );
    expect(m.container.textContent ?? "").toContain("Content");
    unmount(m);
  });

  it("blocks requireOwnership content when the viewer is not the owner", () => {
    authState.user = { id: "u1", email: "a@b.c" };
    authState.isAuthenticated = true;
    authState.isLoading = false;
    viewState.data = {
      viewerRole: "public",
      allowedTabs: ["hub"],
      coach: { ...COACH_VIEW.coach, isOwner: false },
    };
    const m = mount(
      createElement(
        Shell,
        { coachId: "c1", requireOwnership: true },
        createElement("p", null, "Content"),
      ),
    );
    expect(m.container.textContent ?? "").not.toContain("Content");
    unmount(m);
  });
});
