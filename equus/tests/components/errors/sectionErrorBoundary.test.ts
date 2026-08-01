/**
 * @vitest-environment jsdom
 */
import { act } from "react";
import { createElement } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { SectionErrorBoundary } from "@/components/errors/section-error-boundary.tsx";

vi.mock("next-intl", () => ({
  useTranslations: () => (key: string) =>
    ({ tryAgain: "Try again" })[key] ?? key,
}));

let shouldThrow = true;

function Bomber() {
  if (shouldThrow) {
    throw new Error("boom");
  }
  return createElement("p", null, "recovered");
}

function findButton(label: string): HTMLButtonElement | undefined {
  return Array.from(
    document.body.querySelectorAll<HTMLButtonElement>("button"),
  ).find((button) => button.textContent?.trim() === label);
}

describe("SectionErrorBoundary", () => {
  let container: HTMLDivElement;
  let root: Root;

  beforeEach(() => {
    shouldThrow = true;
    (globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT =
      true;
    vi.spyOn(console, "error").mockImplementation(() => {});
    container = document.createElement("div");
    document.body.appendChild(container);
    root = createRoot(container);
  });

  afterEach(() => {
    act(() => {
      root.unmount();
    });
    container.remove();
    vi.restoreAllMocks();
  });

  it("renders the inline fallback when a child throws", () => {
    act(() => {
      root.render(
        createElement(
          SectionErrorBoundary,
          null,
          createElement(Bomber),
        ),
      );
    });

    expect(findButton("Try again")).toBeTruthy();
    expect(document.body.textContent).toContain("boom");
  });

  it("recovers when Try again is pressed", () => {
    act(() => {
      root.render(
        createElement(
          SectionErrorBoundary,
          null,
          createElement(Bomber),
        ),
      );
    });

    expect(document.body.textContent).toContain("boom");

    shouldThrow = false;
    act(() => {
      findButton("Try again")?.click();
    });

    expect(document.body.textContent).toContain("recovered");
  });
});
