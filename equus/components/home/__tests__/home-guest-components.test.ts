/**
 * @vitest-environment jsdom
 */
import * as React from "react";
import { act } from "react";
import { createElement } from "react";
import { createRoot, type Root } from "react-dom/client";
import { describe, expect, it, vi } from "vitest";

import { HomePageContentSkeleton } from "@/components/home/home-page-content-skeleton.tsx";
import { HomeWelcomeHero } from "@/components/home/home-welcome-hero.tsx";
import { HomeGuestPanel } from "@/components/home/home-guest-panel.tsx";

vi.mock("@/i18n/navigation.ts", () => ({
  Link: ({ href, children }: { href: string; children: React.ReactNode }) =>
    createElement("a", { href }, children),
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

describe("HomePageContentSkeleton", () => {
  it("renders a skeleton container with a spinner by default", () => {
    const m = mount(createElement(HomePageContentSkeleton));
    expect(m.container.querySelector('[data-slot="spinner"]')).toBeTruthy();
    expect(m.container.querySelector(".relative.w-full.h-full")).toBeTruthy();
    unmount(m);
  });

  it("hides the spinner when showSpinner is false", () => {
    const m = mount(createElement(HomePageContentSkeleton, { showSpinner: false }));
    expect(m.container.querySelector('[data-slot="spinner"]')).toBeNull();
    unmount(m);
  });
});

describe("HomeWelcomeHero", () => {
  it("renders title and subtitle", () => {
    const m = mount(
      createElement(HomeWelcomeHero, { title: "Welcome to Equus", subtitle: "The platform." }),
    );
    const text = m.container.textContent ?? "";
    expect(text).toContain("Welcome to Equus");
    expect(text).toContain("The platform.");
    unmount(m);
  });
});

describe("HomeGuestPanel", () => {
  it("renders title, description, and sign-in/sign-up links", () => {
    const m = mount(
      createElement(HomeGuestPanel, {
        title: "Get started",
        description: "Sign in or create.",
        signInLabel: "Sign in",
        signUpLabel: "Sign up",
      }),
    );
    const text = m.container.textContent ?? "";
    expect(text).toContain("Get started");
    expect(text).toContain("Sign in or create.");
    expect(text).toContain("Sign in");
    expect(text).toContain("Sign up");
    const anchors = Array.from(m.container.querySelectorAll("a"));
    expect(anchors.some((a) => a.getAttribute("href") === "/signin")).toBe(true);
    expect(anchors.some((a) => a.getAttribute("href") === "/signup")).toBe(true);
    unmount(m);
  });
});
