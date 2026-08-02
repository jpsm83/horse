/**
 * @vitest-environment jsdom
 */
import * as React from "react";
import { act } from "react";
import { createElement } from "react";
import { createRoot, type Root } from "react-dom/client";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { describe, expect, it, vi } from "vitest";

import { useBilling, useCreateCheckout, useStripePortal } from "@/hooks/queries/useBilling.ts";

const queries = vi.hoisted(() => ({
  billing: { current: ["billing", "current"] as const },
}));

vi.mock("@/lib/api/queryKeys", () => ({
  queryKeys: {
    billing: { current: queries.billing.current },
  },
}));

const parseApiResponseMock = vi.hoisted(() => vi.fn());

vi.mock("@/lib/api/fetchWithAuth", () => ({
  fetchWithAuth: vi.fn(),
  parseApiResponse: parseApiResponseMock,
}));

import { fetchWithAuth } from "@/lib/api/fetchWithAuth";

type ConsumerProps = {
  onData?: (data: unknown) => void;
};

function BillingConsumer({ onData }: ConsumerProps) {
  const { data } = useBilling();
  onData?.(data);
  return createElement("span", null, data ? JSON.stringify(data) : "loading");
}

function CheckoutConsumer() {
  const mutation = useCreateCheckout();
  return createElement(
    "button",
    { onClick: () => void mutation.mutateAsync("silver") },
    "checkout",
  );
}

function PortalConsumer() {
  const mutation = useStripePortal();
  return createElement(
    "button",
    { onClick: () => void mutation.mutateAsync() },
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
    root.render(
      createElement(QueryClientProvider, { client: queryClient }, ui),
    );
  });
  return { container, root };
}

function unmount(m: Mount): void {
  act(() => {
    m.root.unmount();
  });
  m.container.remove();
}

describe("useBilling", () => {
  it("fetches billing data with the billing query key", async () => {
    (fetchWithAuth as ReturnType<typeof vi.fn>).mockResolvedValue({ ok: true });
    parseApiResponseMock.mockResolvedValue({ current: 2, limit: 5, tierId: "silver", remaining: 3 });

    const m = mountWithClient(createElement(BillingConsumer));
    // Flush the async query through microtask + macrotask turns so the
    // TanStack observer commits its state.
    await act(async () => {
      for (let i = 0; i < 5; i += 1) {
        await Promise.resolve();
      }
      await new Promise((resolve) => setTimeout(resolve, 0));
      for (let i = 0; i < 5; i += 1) {
        await Promise.resolve();
      }
    });
    const text = m.container.textContent ?? "";
    expect(text).toContain('"tierId":"silver"');
    expect(fetchWithAuth).toHaveBeenCalledWith("/api/v1/billing/current");
    unmount(m);
  });
});

describe("useCreateCheckout", () => {
  it("posts a create-checkout request", async () => {
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
        body: JSON.stringify({ tierId: "silver" }),
      }),
    );
    unmount(m);
  });
});

describe("useStripePortal", () => {
  it("posts a portal request", async () => {
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
      expect.objectContaining({ method: "POST" }),
    );
    unmount(m);
  });
});
