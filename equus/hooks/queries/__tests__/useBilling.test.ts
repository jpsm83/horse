/**
 * @vitest-environment jsdom
 */
import * as React from "react";
import { act } from "react";
import { createElement } from "react";
import { createRoot, type Root } from "react-dom/client";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { describe, expect, it, vi } from "vitest";

import {
  useEntityBilling,
  useCreateEntityCheckout,
  useEntityStripePortal,
} from "@/hooks/queries/useBilling.ts";

const stableId = "stable-billing-test-id";

vi.mock("@/lib/api/queryKeys", () => ({
  queryKeys: {
    billing: {
      entity: (id: string) => ["billing", "entity", id] as const,
    },
  },
}));

const parseApiResponseMock = vi.hoisted(() => vi.fn());

vi.mock("@/lib/api/fetchWithAuth", () => ({
  fetchWithAuth: vi.fn(),
  parseApiResponse: parseApiResponseMock,
}));

import { fetchWithAuth } from "@/lib/api/fetchWithAuth";

function BillingConsumer({ onData }: { onData?: (data: unknown) => void }) {
  const { data } = useEntityBilling(stableId);
  onData?.(data);
  return createElement("span", null, data ? JSON.stringify(data) : "loading");
}

function CheckoutConsumer() {
  const mutation = useCreateEntityCheckout();
  return createElement(
    "button",
    { onClick: () => void mutation.mutateAsync({ stableId }) },
    "checkout",
  );
}

function PortalConsumer() {
  const mutation = useEntityStripePortal();
  return createElement(
    "button",
    { onClick: () => void mutation.mutateAsync(stableId) },
    "portal",
  );
}

type Mount = { container: HTMLDivElement; root: Root };

function mountWithClient(ui: React.ReactElement): Mount {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  const container = document.createElement("div");
  document.body.appendChild(container);
  const root = createRoot(container);
  act(() => {
    root.render(createElement(QueryClientProvider, { client: queryClient }, ui));
  });
  return { container, root };
}

function unmount(m: Mount): void {
  act(() => { m.root.unmount(); });
  m.container.remove();
}

describe("useEntityBilling", () => {
  it("fetches entity billing with stableId query param", async () => {
    (fetchWithAuth as ReturnType<typeof vi.fn>).mockResolvedValue({ ok: true });
    parseApiResponseMock.mockResolvedValue({
      status: "trialing",
      catalogBand: "starter",
      inGoodStanding: true,
      rosterCount: 0,
    });

    const m = mountWithClient(createElement(BillingConsumer));
    await act(async () => {
      for (let i = 0; i < 5; i += 1) await Promise.resolve();
      await new Promise((resolve) => setTimeout(resolve, 0));
    });
    expect(m.container.textContent).toContain('"status":"trialing"');
    expect(fetchWithAuth).toHaveBeenCalledWith(
      `/api/v1/billing/current?stableId=${encodeURIComponent(stableId)}`,
    );
    unmount(m);
  });
});

describe("useCreateEntityCheckout", () => {
  it("posts create-checkout with stableId", async () => {
    (fetchWithAuth as ReturnType<typeof vi.fn>).mockResolvedValue({ ok: true });
    parseApiResponseMock.mockResolvedValue({ url: "https://checkout.stripe.test" });

    const m = mountWithClient(createElement(CheckoutConsumer));
    const button = m.container.querySelector("button");
    await act(async () => {
      button?.dispatchEvent(new MouseEvent("click", { bubbles: true }));
      await Promise.resolve();
    });
    expect(fetchWithAuth).toHaveBeenCalledWith(
      "/api/v1/billing/create-checkout",
      expect.objectContaining({
        method: "POST",
        body: JSON.stringify({ stableId, currency: "EUR" }),
      }),
    );
    unmount(m);
  });
});

describe("useEntityStripePortal", () => {
  it("posts portal with stableId", async () => {
    (fetchWithAuth as ReturnType<typeof vi.fn>).mockResolvedValue({ ok: true });
    parseApiResponseMock.mockResolvedValue({ url: "https://portal.stripe.test" });

    const m = mountWithClient(createElement(PortalConsumer));
    const button = m.container.querySelector("button");
    await act(async () => {
      button?.dispatchEvent(new MouseEvent("click", { bubbles: true }));
      await Promise.resolve();
    });
    expect(fetchWithAuth).toHaveBeenCalledWith(
      "/api/v1/billing/portal",
      expect.objectContaining({
        method: "POST",
        body: JSON.stringify({ stableId }),
      }),
    );
    unmount(m);
  });
});
