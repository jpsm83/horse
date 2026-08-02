/**
 * @vitest-environment jsdom
 */
import * as React from "react";
import { act } from "react";
import { createElement } from "react";
import { createRoot, type Root } from "react-dom/client";
import { describe, expect, it, vi } from "vitest";

import { UserWorkplaceInvitationsSection } from "@/components/user/workplace/user-workplace-invitations-section.tsx";
import { UserWorkplaceListSection } from "@/components/user/workplace/user-workplace-list-section.tsx";

const translationMap: Record<string, string> = {
  "userWorkplace.noInvitations": "No pending invitations.",
  "userWorkplace.noWorkplaces": "You are not part of any workplaces yet.",
  "userWorkplace.unknownWorkplace": "Unknown workplace",
  "userWorkplace.unknownRole": "Unknown role",
  "userWorkplace.hierarchyLevel": "Level",
  "userWorkplace.ownerBadge": "Owner",
  "userWorkplace.invitationAccepted": "Invitation accepted.",
  "userWorkplace.invitationDeclined": "Invitation declined.",
  "userWorkplace.invitationAcceptFailed": "Could not accept.",
  "userWorkplace.invitationDeclineFailed": "Could not decline.",
  "userWorkplace.accept": "Accept",
  "userWorkplace.decline": "Decline",
};

const workplacesState = vi.hoisted(() => ({
  data: null as Array<{
    status: string;
    access?: string;
    profileName?: string;
    roleType: string;
    hierarchyLevel?: string;
    workplaceRelationshipId?: string;
    roleProfileId?: string;
  }> | null,
  isPending: false,
}));

vi.mock("next-intl", () => ({
  useTranslations: (namespace: string) => (key: string) =>
    translationMap[`${namespace}.${key}`] ?? key,
}));

vi.mock("@/hooks/queries", () => ({
  useWorkplaces: () => ({ data: workplacesState.data, isPending: workplacesState.isPending }),
  useAcceptWorkplaceInvitation: () => ({ isPending: false, mutateAsync: vi.fn(async () => {}) }),
  useDeclineWorkplaceInvitation: () => ({ isPending: false, mutateAsync: vi.fn(async () => {}) }),
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

describe("UserWorkplaceInvitationsSection", () => {
  it("shows the empty state when no pending invitations", () => {
    workplacesState.data = [];
    workplacesState.isPending = false;
    const m = mount(createElement(UserWorkplaceInvitationsSection));
    expect(m.container.textContent ?? "").toContain("No pending invitations.");
    unmount(m);
  });

  it("renders pending invitation cards with accept/decline buttons", () => {
    workplacesState.data = [
      {
        status: "invited",
        profileName: "Sunrise Stable",
        roleType: "stable",
        hierarchyLevel: "manager",
        workplaceRelationshipId: "wr1",
      },
    ];
    workplacesState.isPending = false;
    const m = mount(createElement(UserWorkplaceInvitationsSection));
    const text = m.container.textContent ?? "";
    expect(text).toContain("Sunrise Stable");
    expect(text).toContain("stable");
    expect(text).toContain("manager");
    expect(text).toContain("Accept");
    expect(text).toContain("Decline");
    unmount(m);
  });
});

describe("UserWorkplaceListSection", () => {
  it("shows the empty state when no active workplaces", () => {
    workplacesState.data = [];
    workplacesState.isPending = false;
    const m = mount(createElement(UserWorkplaceListSection));
    expect(m.container.textContent ?? "").toContain("You are not part of any workplaces yet.");
    unmount(m);
  });

  it("renders active workplaces with role and owner badge", () => {
    workplacesState.data = [
      {
        status: "active",
        access: "owner",
        profileName: "Sunrise Stable",
        roleType: "stable",
        roleProfileId: "rp1",
      },
    ];
    workplacesState.isPending = false;
    const m = mount(createElement(UserWorkplaceListSection));
    const text = m.container.textContent ?? "";
    expect(text).toContain("Sunrise Stable");
    expect(text).toContain("stable");
    expect(text).toContain("Owner");
    unmount(m);
  });
});
