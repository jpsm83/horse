/**
 * @vitest-environment jsdom
 */
import * as React from "react";
import { act } from "react";
import { createElement } from "react";
import { createRoot, type Root } from "react-dom/client";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { GuestLandingContent } from "@/app/[locale]/client";
import { USER_HOME_PATH } from "@/lib/navigation/postAuthRedirect.ts";

const translationMap: Record<string, string> = {
  "home.guestTitle": "Welcome to Equus",
  "home.guestDescription": "The platform for equine professionals.",
  "home.getStartedTitle": "Get started",
  "home.getStartedDescription": "Sign in or create a free account.",
  "home.loadFailed": "Failed to load.",
  "common.signIn": "Sign in",
  "common.signUp": "Sign up",
};

const authState = vi.hoisted(() => ({
  isAuthenticated: false,
  isLoading: false,
}));

const replaceMock = vi.fn();

vi.mock("next-intl", () => ({
  useTranslations: (namespace: string) => (key: string) =>
    translationMap[`${namespace}.${key}`] ?? key,
}));

vi.mock("@/i18n/navigation.ts", () => ({
  Link: ({ href, children }: { href: string; children: React.ReactNode }) =>
    createElement("a", { href }, children),
  useRouter: () => ({ replace: replaceMock, push: vi.fn() }),
}));

vi.mock("@/hooks/use-app-auth.ts", () => ({
  useAppAuth: () => ({
    user: authState.isAuthenticated ? { id: "u1", email: "a@b.c" } : null,
    isAuthenticated: authState.isAuthenticated,
    isLoading: authState.isLoading,
    logout: async () => {},
  }),
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

describe("GuestLandingContent", () => {
  beforeEach(() => {
    authState.isAuthenticated = false;
    authState.isLoading = false;
    replaceMock.mockReset();
  });

  it("shows a skeleton while auth is loading", () => {
    authState.isLoading = true;
    const m = mount(createElement(GuestLandingContent));
    expect(m.container.querySelector('[data-slot="spinner"]')).toBeTruthy();
    unmount(m);
  });

  it("shows guest panels when unauthenticated", () => {
    const m = mount(createElement(GuestLandingContent));
    const text = m.container.textContent ?? "";
    expect(text).toContain("Welcome to Equus");
    expect(text).toContain("Get started");
    const anchors = Array.from(m.container.querySelectorAll("a"));
    expect(anchors.some((a) => a.getAttribute("href") === "/signin")).toBe(true);
    expect(anchors.some((a) => a.getAttribute("href") === "/signup")).toBe(true);
    unmount(m);
  });

  it("redirects authenticated users to /home", () => {
    authState.isAuthenticated = true;
    const m = mount(createElement(GuestLandingContent));
    expect(m.container.querySelector('[data-slot="spinner"]')).toBeTruthy();
    expect(replaceMock).toHaveBeenCalledWith(USER_HOME_PATH);
    unmount(m);
  });
});
