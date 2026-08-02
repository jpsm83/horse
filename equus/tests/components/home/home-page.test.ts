/**
 * @vitest-environment jsdom
 */
import * as React from "react";
import { act } from "react";
import { createElement } from "react";
import { createRoot, type Root } from "react-dom/client";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { LucideIcon } from "lucide-react";

import { GuestLandingContent } from "@/app/[locale]/client";
import { HomeContent } from "@/app/[locale]/home/client";
import { HomePageContentSkeleton } from "@/components/home/home-page-content-skeleton.tsx";
import { HomeWelcomeHero } from "@/components/home/home-welcome-hero.tsx";
import { HomeGuestPanel } from "@/components/home/home-guest-panel.tsx";
import { HomeUserWelcomeHero } from "@/components/home/home-user-welcome-hero.tsx";
import { HomeUserAddHorseCard } from "@/components/home/home-user-add-horse-card.tsx";
import { HomeUserSubsectionCard } from "@/components/home/home-user-subsection-card.tsx";

const MockIcon: LucideIcon = (({ className }: { className?: string }) =>
  createElement("span", { "data-testid": "icon", className })) as unknown as LucideIcon;

const translationMap: Record<string, string> = {
  "home.guestTitle": "Welcome to Equus",
  "home.guestDescription": "The platform for equine professionals.",
  "home.getStartedTitle": "Get started",
  "home.getStartedDescription": "Sign in or create a free account.",
  "home.welcomeUser": "Welcome, {name}",
  "home.welcomeSubtitle": "Your dashboard.",
  "home.addHorseEyebrow": "Quick action",
  "home.addHorseDescription": "Add a horse.",
  "home.profilesHeading": "Your profiles",
  "home.profilesDescription": "Jump straight in.",
  "home.subsectionsLabel": "Your profiles",
  "common.signIn": "Sign in",
  "common.signUp": "Sign up",
  "header.create.addHorse": "Add horse",
  "header.myOwn.stables": "Stables",
};

const authState = vi.hoisted(() => ({
  user: null as {
    id: string;
    email: string;
    profileComplete: boolean;
    [key: string]: unknown;
  } | null,
  isAuthenticated: false,
  isLoading: false,
}));

const queryState = vi.hoisted(() => ({
  owned: null as Record<string, boolean> | null,
  profile: null as { personalDetails?: Record<string, unknown> } | null,
  navPending: false,
  profilePending: false,
}));

vi.mock("next-intl", () => ({
  useTranslations: (namespace: string) => (key: string, values?: Record<string, string>) => {
    let value = translationMap[`${namespace}.${key}`] ?? key;
    if (values) {
      for (const [k, v] of Object.entries(values)) {
        value = value.replace(`{${k}}`, v);
      }
    }
    return value;
  },
}));

vi.mock("@/i18n/navigation.ts", () => ({
  Link: ({ href, children }: { href: string; children: React.ReactNode }) =>
    createElement("a", { href }, children),
  useRouter: () => ({ replace: vi.fn(), push: vi.fn() }),
  usePathname: () => "/home",
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
  useUserNavigation: () => ({
    data: queryState.owned,
    isPending: queryState.navPending,
  }),
  useUserProfile: () => ({
    data: queryState.profile,
    isPending: queryState.profilePending,
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

describe("HomeUserWelcomeHero", () => {
  it("renders avatar initials when avatarLabel is provided", () => {
    const m = mount(
      createElement(HomeUserWelcomeHero, {
        title: "Welcome, Ada",
        subtitle: "Sub",
        avatarLabel: "Ada Lovelace",
      }),
    );
    expect(m.container.textContent ?? "").toContain("AL");
    unmount(m);
  });

  it("omits the avatar when avatarLabel is absent", () => {
    const m = mount(
      createElement(HomeUserWelcomeHero, { title: "Welcome", subtitle: "Sub" }),
    );
    expect(m.container.querySelector("img")).toBeNull();
    unmount(m);
  });
});

describe("HomeUserAddHorseCard", () => {
  it("renders title, eyebrow, description, and icon", () => {
    const m = mount(
      createElement(HomeUserAddHorseCard, {
        href: "/horses/new",
        eyebrow: "Quick action",
        title: "Add horse",
        description: "Add a horse.",
        icon: MockIcon,
      }),
    );
    const text = m.container.textContent ?? "";
    expect(text).toContain("Add horse");
    expect(text).toContain("Quick action");
    expect(text).toContain("Add a horse.");
    expect(m.container.querySelector('[data-testid="icon"]')).toBeTruthy();
    const anchors = Array.from(m.container.querySelectorAll("a"));
    expect(anchors.some((a) => a.getAttribute("href") === "/horses/new")).toBe(true);
    unmount(m);
  });
});

describe("HomeUserSubsectionCard", () => {
  it("renders label with the icon", () => {
    const m = mount(
      createElement(HomeUserSubsectionCard, {
        href: "/stables",
        label: "Stables",
        icon: MockIcon,
      }),
    );
    expect(m.container.textContent ?? "").toContain("Stables");
    expect(m.container.querySelector('[data-testid="icon"]')).toBeTruthy();
    const anchors = Array.from(m.container.querySelectorAll("a"));
    expect(anchors.some((a) => a.getAttribute("href") === "/stables")).toBe(true);
    unmount(m);
  });
});

describe("GuestLandingContent", () => {
  beforeEach(() => {
    authState.user = null;
    authState.isAuthenticated = false;
    authState.isLoading = false;
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

  it("renders a skeleton for an authenticated user (redirect handled by effect)", () => {
    authState.user = { id: "u1", email: "a@b.c", profileComplete: true };
    authState.isAuthenticated = true;
    const m = mount(createElement(GuestLandingContent));
    expect(m.container.querySelector('[data-slot="spinner"]')).toBeTruthy();
    unmount(m);
  });
});

describe("HomeContent", () => {
  beforeEach(() => {
    authState.user = null;
    authState.isAuthenticated = false;
    authState.isLoading = false;
    queryState.owned = null;
    queryState.profile = null;
    queryState.navPending = false;
    queryState.profilePending = false;
  });

  it("shows a skeleton while auth is loading", () => {
    authState.isLoading = true;
    const m = mount(createElement(HomeContent));
    expect(m.container.querySelector('[data-slot="spinner"]')).toBeTruthy();
    unmount(m);
  });

  it("shows a skeleton for an unauthenticated user (redirect handled by effect)", () => {
    const m = mount(createElement(HomeContent));
    expect(m.container.querySelector('[data-slot="spinner"]')).toBeTruthy();
    unmount(m);
  });

  it("renders the user home panels when authenticated with data", () => {
    authState.user = {
      id: "u1",
      email: "ada@example.com",
      profileComplete: true,
    };
    authState.isAuthenticated = true;
    queryState.profile = {
      personalDetails: { firstName: "Ada", lastName: "Lovelace", imageUrl: "" },
    };
    queryState.owned = { stables: true };

    const m = mount(createElement(HomeContent));
    const text = m.container.textContent ?? "";
    expect(text).toContain("Welcome, Ada");
    expect(text).toContain("Add horse");
    expect(text).toContain("Stables");
    unmount(m);
  });

  it("omits the profiles grid when no subsections are owned", () => {
    authState.user = { id: "u1", email: "ada@example.com", profileComplete: true };
    authState.isAuthenticated = true;
    queryState.profile = { personalDetails: { firstName: "Ada", imageUrl: "" } };
    queryState.owned = null;

    const m = mount(createElement(HomeContent));
    const text = m.container.textContent ?? "";
    expect(text).toContain("Add horse");
    expect(text).not.toContain("Stables");
    unmount(m);
  });
});
