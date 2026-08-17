/**
 * @vitest-environment jsdom
 */
import * as React from "react";
import { act } from "react";
import { createElement } from "react";
import { createRoot, type Root } from "react-dom/client";
import { describe, expect, it, vi } from "vitest";

import { NotificationsContent } from "@/components/notifications/notifications-content.tsx";

const translationMap: Record<string, string> = {
  "notifications.title": "Notifications",
  "notifications.description": "In-app alerts and activity updates for your account.",
  "notifications.empty": "You have no notifications.",
  "notifications.markRead": "Mark as read",
  "notifications.loadFailed": "Failed to load notifications.",
  "notifications.previous": "Previous",
  "notifications.next": "Next",
  "notifications.pageOf": "Page {page} of {total}",
  "common.home": "Home",
};

const authState = vi.hoisted(() => ({
  isAuthenticated: false,
  isLoading: false,
}));

const notifState = vi.hoisted(() => ({
  data: null as {
    notifications: Array<{
      id: string;
      notificationType: string;
      title: string;
      message: string;
      isRead: boolean;
      createdAt: string;
    }>;
    total: number;
    page: number;
    totalPages: number;
  } | null,
  isPending: false,
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
  useRouter: () => ({ replace: vi.fn(), push: vi.fn() }),
}));

vi.mock("@/components/navigation/app-home-link.tsx", () => ({
  AppHomeLink: ({ children }: { children: React.ReactNode }) => createElement("span", null, children),
}));

vi.mock("@/hooks/use-app-auth.ts", () => ({
  useAppAuth: () => ({
    user: null,
    isAuthenticated: authState.isAuthenticated,
    isLoading: authState.isLoading,
    logout: async () => {},
  }),
}));

vi.mock("@/hooks/queries/useNotification.ts", () => ({
  useNotifications: () => ({ data: notifState.data, isPending: notifState.isPending }),
  useMarkNotificationRead: () => ({ isPending: false, mutateAsync: vi.fn(async () => {}) }),
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

describe("NotificationsContent", () => {
  it("shows the empty state when there are no notifications", () => {
    authState.isAuthenticated = true;
    authState.isLoading = false;
    notifState.data = { notifications: [], total: 0, page: 1, totalPages: 1 };
    notifState.isPending = false;
    const m = mount(createElement(NotificationsContent));
    expect(m.container.textContent ?? "").toContain("You have no notifications.");
    unmount(m);
  });

  it("renders notification cards with title, message, and mark-read button", () => {
    authState.isAuthenticated = true;
    authState.isLoading = false;
    notifState.data = {
      notifications: [
        {
          id: "n1",
          notificationType: "relationship",
          title: "New relationship request",
          message: "Ada wants to connect.",
          isRead: false,
          createdAt: "2026-08-02T10:00:00.000Z",
        },
      ],
      total: 1,
      page: 1,
      totalPages: 1,
    };
    notifState.isPending = false;
    const m = mount(createElement(NotificationsContent));
    const text = m.container.textContent ?? "";
    expect(text).toContain("New relationship request");
    expect(text).toContain("Ada wants to connect.");
    expect(text).toContain("Mark as read");
    unmount(m);
  });

  it("omits the mark-read button for already-read notifications", () => {
    authState.isAuthenticated = true;
    authState.isLoading = false;
    notifState.data = {
      notifications: [
        {
          id: "n1",
          notificationType: "info",
          title: "Welcome",
          message: "Thanks for joining.",
          isRead: true,
          createdAt: "2026-08-02T10:00:00.000Z",
        },
      ],
      total: 1,
      page: 1,
      totalPages: 1,
    };
    notifState.isPending = false;
    const m = mount(createElement(NotificationsContent));
    const text = m.container.textContent ?? "";
    expect(text).toContain("Welcome");
    expect(text).not.toContain("Mark as read");
    unmount(m);
  });

  it("shows a skeleton while loading", () => {
    authState.isAuthenticated = true;
    authState.isLoading = true;
    notifState.isPending = false;
    const m = mount(createElement(NotificationsContent));
    expect(m.container.querySelector('[data-slot="spinner"]')).toBeTruthy();
    unmount(m);
  });
});
