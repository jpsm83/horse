/**
 * @vitest-environment jsdom
 */
import * as React from "react";
import { act } from "react";
import { createElement } from "react";
import { createRoot, type Root } from "react-dom/client";
import { describe, expect, it, vi } from "vitest";

import { SubscriptionPageContent } from "@/components/billing/subscription-page-content.tsx";

const translationMap: Record<string, string> = {
  "subscription.title": "Subscription",
  "subscription.current": "Current",
  "subscription.currentPlan": "Current plan",
  "subscription.horsesUsed": "horses used",
  "subscription.manage": "Manage",
  "subscription.subscribe": "Subscribe",
  "subscription.change": "Change plan",
  "subscription.updatePayment": "Update payment method",
  "subscription.billingHistory": "Billing history",
  "subscription.plans": "Plans",
  "subscription.unlimitedHorses": "Unlimited horses",
  "subscription.upToHorses": "Up to {count} horses",
  "subscription.signInToSubscribe": "Sign in to manage your subscription.",
  "subscription.loadFailed": "Failed to load subscription info.",
};

const authState = vi.hoisted(() => ({
  isAuthenticated: false,
}));

const billingState = vi.hoisted(() => ({
  data: null as { current: number; limit: number; tierId: string; remaining: number } | null,
  isPending: false,
  isFetching: false,
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
}));

vi.mock("@/hooks/use-app-auth.ts", () => ({
  useAppAuth: () => ({
    user: null,
    isAuthenticated: authState.isAuthenticated,
    isLoading: false,
    logout: async () => {},
  }),
}));

vi.mock("@/hooks/queries/useBilling.ts", () => ({
  useBilling: () => ({
    data: billingState.data,
    isPending: billingState.isPending,
    isFetching: billingState.isFetching,
  }),
  useCreateCheckout: () => ({ mutateAsync: vi.fn(async () => ({ url: "https://checkout.stripe.test" })) }),
  useStripePortal: () => ({ mutateAsync: vi.fn(async () => ({ url: "https://portal.stripe.test" })) }),
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

describe("SubscriptionPageContent", () => {
  it("shows a skeleton while fetching", () => {
    authState.isAuthenticated = true;
    billingState.data = null;
    billingState.isFetching = true;
    billingState.isPending = false;
    const m = mount(createElement(SubscriptionPageContent));
    expect(m.container.querySelector('[data-slot="spinner"]')).toBeTruthy();
    unmount(m);
  });

  it("renders plan tiers for a guest without the usage section", () => {
    authState.isAuthenticated = false;
    billingState.data = null;
    billingState.isFetching = false;
    billingState.isPending = false;
    const m = mount(createElement(SubscriptionPageContent));
    const text = m.container.textContent ?? "";
    expect(text).toContain("Subscription");
    expect(text).toContain("Free");
    expect(text).toContain("Subscribe");
    unmount(m);
  });

  it("renders the current plan usage when authenticated", () => {
    authState.isAuthenticated = true;
    billingState.data = { current: 2, limit: 5, tierId: "silver", remaining: 3 };
    billingState.isFetching = false;
    billingState.isPending = false;
    const m = mount(createElement(SubscriptionPageContent));
    const text = m.container.textContent ?? "";
    expect(text).toContain("Silver");
    expect(text).toContain("2 of 5 horses used");
    expect(text).toContain("Manage");
    unmount(m);
  });
});
