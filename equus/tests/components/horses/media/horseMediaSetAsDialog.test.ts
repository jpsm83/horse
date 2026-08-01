/**
 * @vitest-environment jsdom
 */
import { act } from "react";
import { createElement } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { HorseMediaSetAsDialog } from "@/components/horses/media/horse-media-set-as-dialog.tsx";

const TRANSLATIONS: Record<string, string> = {
  setAsProfile: "Set as profile",
  setAsHero: "Set as hero",
  setAsConfirmTitle: "Set as image",
  setAsConfirmDescription: "Choose where to use this image.",
  cancel: "Cancel",
  loading: "Loading...",
};

vi.mock("next-intl", () => ({
  useTranslations: () => (key: string) => TRANSLATIONS[key] ?? key,
}));

function findButton(label: string): HTMLButtonElement | undefined {
  return Array.from(
    document.body.querySelectorAll<HTMLButtonElement>("button"),
  ).find((button) => button.textContent?.trim() === label);
}

function dispatchEscape() {
  act(() => {
    document.dispatchEvent(
      new KeyboardEvent("keydown", { key: "Escape", bubbles: true }),
    );
  });
}

describe("HorseMediaSetAsDialog", () => {
  let container: HTMLDivElement;
  let root: Root;

  beforeEach(() => {
    (globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT =
      true;
    container = document.createElement("div");
    document.body.appendChild(container);
    root = createRoot(container);
  });

  afterEach(() => {
    act(() => {
      root.unmount();
    });
    container.remove();
  });

  it("renders profile/hero/cancel actions when open", () => {
    act(() => {
      root.render(
        createElement(HorseMediaSetAsDialog, {
          open: true,
          onOpenChange: () => undefined,
          isPending: false,
          onSetAsProfile: () => undefined,
          onSetAsHero: () => undefined,
        }),
      );
    });

    expect(findButton("Set as profile")).toBeTruthy();
    expect(findButton("Set as hero")).toBeTruthy();
    expect(findButton("Cancel")).toBeTruthy();
  });

  it("invokes the profile and hero callbacks", () => {
    const onSetAsProfile = vi.fn();
    const onSetAsHero = vi.fn();
    act(() => {
      root.render(
        createElement(HorseMediaSetAsDialog, {
          open: true,
          onOpenChange: () => undefined,
          isPending: false,
          onSetAsProfile,
          onSetAsHero,
        }),
      );
    });

    act(() => {
      findButton("Set as profile")?.click();
    });
    act(() => {
      findButton("Set as hero")?.click();
    });

    expect(onSetAsProfile).toHaveBeenCalledTimes(1);
    expect(onSetAsHero).toHaveBeenCalledTimes(1);
  });

  it("disables actions and blocks dismissal while isPending", () => {
    const onOpenChange = vi.fn();
    act(() => {
      root.render(
        createElement(HorseMediaSetAsDialog, {
          open: true,
          onOpenChange,
          isPending: true,
          onSetAsProfile: () => undefined,
          onSetAsHero: () => undefined,
        }),
      );
    });

    expect(findButton("Set as profile")?.disabled).toBe(true);
    expect(findButton("Set as hero")?.disabled).toBe(true);

    dispatchEscape();
    expect(onOpenChange).not.toHaveBeenCalled();
  });
});
