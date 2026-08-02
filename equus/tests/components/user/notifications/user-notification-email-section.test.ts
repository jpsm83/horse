/**
 * @vitest-environment jsdom
 */
import * as React from "react";
import { act } from "react";
import { createElement } from "react";
import { createRoot, type Root } from "react-dom/client";
import { describe, expect, it, vi } from "vitest";

import { UserNotificationEmailSection } from "@/components/user/notifications/user-notification-email-section.tsx";

const translationMap: Record<string, string> = {
  "userNotifications.email.relationshipRequests.label": "Relationship requests",
  "userNotifications.email.relationshipRequests.description": "When someone requests a connection.",
  "userNotifications.email.ownershipTransfers.label": "Ownership transfers",
  "userNotifications.email.ownershipTransfers.description": "When an ownership transfer is pending.",
  "userNotifications.email.workplaceInvitations.label": "Workplace invitations",
  "userNotifications.email.workplaceInvitations.description": "When a workplace invites you.",
  "userNotifications.email.messages.label": "Messages",
  "userNotifications.email.messages.description": "When you receive a message.",
  "userNotifications.email.system.label": "System updates",
  "userNotifications.email.system.description": "Product and security updates.",
  "userNotifications.saveFailed": "Could not update preferences.",
};

const prefsState = vi.hoisted(() => ({
  data: null as { email: Record<string, boolean> } | null,
  isPending: false,
  updatePending: false,
}));

vi.mock("next-intl", () => ({
  useTranslations: (namespace: string) => (key: string) =>
    translationMap[`${namespace}.${key}`] ?? key,
}));

vi.mock("@/hooks/queries/useCurrentUser.ts", () => ({
  useNotificationPreferences: () => ({ data: prefsState.data, isPending: prefsState.isPending }),
  useUpdateNotificationPreferences: () => ({
    isPending: prefsState.updatePending,
    mutateAsync: vi.fn(async () => {}),
  }),
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

describe("UserNotificationEmailSection", () => {
  it("shows skeleton rows while preferences are loading", () => {
    prefsState.data = null;
    prefsState.isPending = true;
    const m = mount(createElement(UserNotificationEmailSection, { userId: "u1" }));
    expect(m.container.querySelectorAll(".animate-pulse").length).toBeGreaterThan(0);
    unmount(m);
  });

  it("renders an email toggle per key once loaded", () => {
    prefsState.data = { email: { relationshipRequests: true, system: false } };
    prefsState.isPending = false;
    const m = mount(createElement(UserNotificationEmailSection, { userId: "u1" }));
    const text = m.container.textContent ?? "";
    expect(text).toContain("Relationship requests");
    expect(text).toContain("Ownership transfers");
    expect(text).toContain("Workplace invitations");
    expect(text).toContain("Messages");
    expect(text).toContain("System updates");
    expect(m.container.querySelectorAll('[data-slot="switch"]').length).toBe(5);
    unmount(m);
  });
});
