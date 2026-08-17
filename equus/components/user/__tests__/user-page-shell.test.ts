/**
 * @vitest-environment jsdom
 */
import * as React from "react";
import { act } from "react";
import { createElement } from "react";
import { createRoot, type Root } from "react-dom/client";
import { describe, expect, it, vi } from "vitest";
import type { ComponentType } from "react";

import { UserPageShell } from "@/components/user/user-page-shell.tsx";

const authState = vi.hoisted(() => ({
  user: null as { id: string; email: string } | null,
  isAuthenticated: false,
  isLoading: false,
}));

const viewState = vi.hoisted(() => ({
  isLoading: false,
}));

vi.mock("next-intl", () => ({
  useTranslations: () => (key: string) => key,
}));

vi.mock("@/i18n/navigation.ts", () => ({
  useRouter: () => ({ replace: vi.fn(), push: vi.fn() }),
}));

vi.mock("@/hooks/use-app-auth.ts", () => ({
  useAppAuth: () => ({
    user: authState.user,
    isAuthenticated: authState.isAuthenticated,
    isLoading: authState.isLoading,
    logout: async () => {},
  }),
}));

vi.mock("@/hooks/queries/useCurrentUser.ts", () => ({
  useUserView: () => ({ isLoading: viewState.isLoading }),
}));

vi.mock("@/lib/navigation/postAuthRedirect.ts", () => ({
  buildSignInPath: (next?: string) => `/signin?next=${encodeURIComponent(next ?? "/home")}`,
}));

vi.mock("@/lib/navigation/userTabs.ts", () => ({
  userProfilePath: (userId: string) => `/user/${userId}/profile`,
}));

// children is passed as a positional createElement arg (React-first); the cast
// keeps TS from requiring it in the props object while UserPageShell still
// receives it via the children slot.
const Shell = UserPageShell as ComponentType<{ userId: string }>;

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

describe("UserPageShell", () => {
  it("shows a skeleton while auth or view is loading", () => {
    authState.user = null;
    authState.isAuthenticated = false;
    authState.isLoading = true;
    viewState.isLoading = false;
    const m = mount(
      createElement(Shell, { userId: "u1" }, createElement("p", null, "Content")),
    );
    expect(m.container.querySelector('[data-slot="spinner"]')).toBeTruthy();
    expect(m.container.textContent ?? "").not.toContain("Content");
    unmount(m);
  });

  it("shows a skeleton for an unauthenticated user (redirect handled by effect)", () => {
    authState.user = null;
    authState.isAuthenticated = false;
    authState.isLoading = false;
    viewState.isLoading = false;
    const m = mount(
      createElement(Shell, { userId: "u1" }, createElement("p", null, "Content")),
    );
    expect(m.container.textContent ?? "").not.toContain("Content");
    unmount(m);
  });

  it("shows a skeleton when the userId is not the current user (redirect handled by effect)", () => {
    authState.user = { id: "u2", email: "a@b.c" };
    authState.isAuthenticated = true;
    authState.isLoading = false;
    viewState.isLoading = false;
    const m = mount(
      createElement(Shell, { userId: "u1" }, createElement("p", null, "Content")),
    );
    expect(m.container.textContent ?? "").not.toContain("Content");
    unmount(m);
  });

  it("renders children when the user owns the profile", () => {
    authState.user = { id: "u1", email: "a@b.c" };
    authState.isAuthenticated = true;
    authState.isLoading = false;
    viewState.isLoading = false;
    const m = mount(
      createElement(Shell, { userId: "u1" }, createElement("p", null, "Content")),
    );
    expect(m.container.textContent ?? "").toContain("Content");
    unmount(m);
  });
});
