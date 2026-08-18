/**
 * @vitest-environment jsdom
 * Signed-in /home action inbox — Block 20.
 */
import * as React from "react";
import { act } from "react";
import { createElement } from "react";
import { createRoot, type Root } from "react-dom/client";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { HomeContent } from "@/app/[locale]/home/client";
import { HomeActionInbox } from "@/components/home/home-action-inbox.tsx";
import { HomePageContentSkeleton } from "@/components/home/home-page-content-skeleton.tsx";
import { HomeUserWelcomeHero } from "@/components/home/home-user-welcome-hero.tsx";

const translationMap: Record<string, string> = {
  "home.welcomeUser": "Welcome, {name}",
  "home.welcomeSubtitle": "Review pending invites.",
  "home.inboxHeading": "Action inbox",
  "home.inboxDescription": "Pending invites.",
  "home.emptyInbox": "You're all caught up.",
  "home.emptyInboxHint": "Manage horses and stables from their modules.",
  "home.openHorsesModule": "Go to horses",
  "home.openStablesModule": "Go to stables",
  "home.inboxLoading": "Loading…",
  "home.relationshipsHeading": "Horse connection invites",
  "home.workplacesHeading": "Workplace invitations",
  "home.viewAllRelationships": "All relationship invites",
  "home.viewAllWorkplaces": "All workplace invites",
  "home.openConnect": "Open Connect",
  "home.openWorkplace": "Workplace tab",
  "invites.relationships.accept": "Accept",
  "invites.relationships.decline": "Decline",
  "invites.relationships.accepted": "Accepted",
  "invites.relationships.declined": "Declined",
  "invites.workplaces.accept": "Accept",
  "invites.workplaces.decline": "Decline",
  "invites.workplaces.accepted": "Accepted",
  "invites.workplaces.declined": "Declined",
  "common.from": "from {label}",
  "common.horseFallback": "Horse",
  "status.requestFailed": "Request failed.",
};

const authState = vi.hoisted(() => ({
  user: null as { id: string; email: string; profileComplete: boolean } | null,
  isAuthenticated: false,
  isLoading: false,
}));

const queryState = vi.hoisted(() => ({
  profile: null as { personalDetails?: Record<string, unknown> } | null,
  profilePending: false,
  relationships: [] as Array<{
    id: string;
    horseId: string;
    horseName?: string;
    relationshipType: string;
    requesterLabel?: string;
  }>,
  relationshipsPending: false,
  workplaces: [] as Array<{
    roleType: string;
    roleProfileId: string;
    access: string;
    status?: string;
    workplaceRelationshipId?: string;
    membershipId?: string;
    profileName?: string;
    hierarchyLevel?: string;
  }>,
  workplacesPending: false,
  waitingTransferHorses: [] as Array<{
    horseId: string;
    horseName: string;
    hostStableId: string;
    hostStableName?: string;
    invitedOwnerEmail: string;
    role: "provisional_owner" | "invited_owner";
  }>,
  waitingTransferPending: false,
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
  useUserProfile: () => ({
    data: queryState.profile,
    isPending: queryState.profilePending,
  }),
}));

vi.mock("@/hooks/queries/useAuthData.ts", () => ({
  usePendingRelationships: () => ({
    data: queryState.relationships,
    isPending: queryState.relationshipsPending,
  }),
  useWorkplaces: () => ({
    data: queryState.workplaces,
    isPending: queryState.workplacesPending,
  }),
  useWaitingTransferHorses: () => ({
    data: queryState.waitingTransferHorses,
    isPending: queryState.waitingTransferPending,
  }),
  useAcceptWorkplaceInvitation: () => ({ isPending: false, mutateAsync: vi.fn(async () => {}) }),
  useDeclineWorkplaceInvitation: () => ({ isPending: false, mutateAsync: vi.fn(async () => {}) }),
}));

vi.mock("@/hooks/queries/useRelationship.ts", () => ({
  useAcceptRelationship: () => ({ isPending: false, mutateAsync: vi.fn(async () => {}) }),
  useDeclineRelationship: () => ({ isPending: false, mutateAsync: vi.fn(async () => {}) }),
}));

vi.mock("@/hooks/use-app-toast.ts", () => ({
  useAppToast: () => ({ success: vi.fn(), error: vi.fn(), info: vi.fn() }),
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
});

describe("HomeActionInbox", () => {
  beforeEach(() => {
    queryState.relationships = [];
    queryState.workplaces = [];
    queryState.waitingTransferHorses = [];
    queryState.relationshipsPending = false;
    queryState.workplacesPending = false;
    queryState.waitingTransferPending = false;
  });

  it("shows empty state with module links when there are no pending invites", () => {
    const m = mount(createElement(HomeActionInbox, { userId: "u1" }));
    const text = m.container.textContent ?? "";
    expect(text).toContain("You're all caught up.");
    expect(text).toContain("Go to horses");
    expect(text).toContain("Go to stables");
    unmount(m);
  });

  it("lists pending relationship and workplace invites", () => {
    queryState.relationships = [
      {
        id: "r1",
        horseId: "h1",
        horseName: "Comet",
        relationshipType: "groom",
        requesterLabel: "Sam",
      },
    ];
    queryState.workplaces = [
      {
        roleType: "stable",
        roleProfileId: "s1",
        access: "collaborator",
        status: "invited",
        workplaceRelationshipId: "w1",
        profileName: "Sunrise Stable",
        hierarchyLevel: "staff",
      },
    ];

    const m = mount(createElement(HomeActionInbox, { userId: "u1" }));
    const text = m.container.textContent ?? "";
    expect(text).toContain("Comet");
    expect(text).toContain("Sunrise Stable");
    expect(text).toContain("Open Connect");
    unmount(m);
  });
});

describe("HomeContent", () => {
  beforeEach(() => {
    authState.user = null;
    authState.isAuthenticated = false;
    authState.isLoading = false;
    queryState.profile = null;
    queryState.profilePending = false;
    queryState.relationships = [];
    queryState.workplaces = [];
  });

  it("shows a skeleton while auth is loading", () => {
    authState.isLoading = true;
    const m = mount(createElement(HomeContent));
    expect(m.container.querySelector('[data-slot="spinner"]')).toBeTruthy();
    unmount(m);
  });

  it("renders the action inbox when authenticated", () => {
    authState.user = { id: "u1", email: "ada@example.com", profileComplete: true };
    authState.isAuthenticated = true;
    queryState.profile = {
      personalDetails: { firstName: "Ada", lastName: "Lovelace", imageUrl: "" },
    };

    const m = mount(createElement(HomeContent));
    const text = m.container.textContent ?? "";
    expect(text).toContain("Welcome, Ada");
    expect(text).toContain("Action inbox");
    expect(text).not.toContain("Add horse");
    unmount(m);
  });
});

describe("HomePageContentSkeleton", () => {
  it("renders a spinner", () => {
    const m = mount(createElement(HomePageContentSkeleton));
    expect(m.container.querySelector('[data-slot="spinner"]')).toBeTruthy();
    unmount(m);
  });
});
