/**
 * @vitest-environment jsdom
 */
import * as React from "react";
import { act } from "react";
import { createElement } from "react";
import { createRoot, type Root } from "react-dom/client";
import { describe, expect, it, vi } from "vitest";

import { UserSubscriptionPlanSection } from "@/components/user/subscription/user-subscription-plan-section.tsx";

const translationMap: Record<string, string> = {
  "userSubscription.status.trial": "Trial",
  "userSubscription.status.active": "Active",
  "userSubscription.horseLimit": "Horse limit",
  "userSubscription.unlimited": "Unlimited",
  "userSubscription.upgradeCallout": "Upgrade your plan",
  "userSubscription.upgradeDescription": "Unlock more horse slots.",
  "userSubscription.upgradeButton": "Upgrade",
  "userSubscription.upgradeComingSoon": "Upgrades are coming soon.",
  "userSubscription.renewsOn": "Renews on {date}",
  "userSubscription.trialEndsOn": "Trial ends on {date}",
};

const viewState = vi.hoisted(() => ({
  data: null as {
    user?: {
      subscription?: {
        tier?: string;
        status?: string;
        currentPeriodEnd?: string;
        trialEndsAt?: string;
      };
    };
  } | null,
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

vi.mock("@/hooks/queries/useCurrentUser.ts", () => ({
  useUserView: () => ({ data: viewState.data, isLoading: false }),
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

describe("UserSubscriptionPlanSection", () => {
  it("shows the free plan and upgrade CTA when no subscription exists", () => {
    viewState.data = {};
    const m = mount(createElement(UserSubscriptionPlanSection, { userId: "u1" }));
    const text = m.container.textContent ?? "";
    expect(text).toContain("Free");
    expect(text).toContain("Upgrade your plan");
    unmount(m);
  });

  it("shows an active paid plan without the upgrade CTA", () => {
    viewState.data = {
      user: { subscription: { tier: "silver", status: "active" } },
    };
    const m = mount(createElement(UserSubscriptionPlanSection, { userId: "u1" }));
    const text = m.container.textContent ?? "";
    expect(text).toContain("Silver");
    expect(text).toContain("Active");
    expect(text).not.toContain("Upgrade your plan");
    unmount(m);
  });
});
