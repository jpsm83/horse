/**
 * @vitest-environment jsdom
 */
import { act } from "react";
import { createElement } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { ConfirmActionDialog } from "@/components/shared/confirm-action-dialog.tsx";

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

function dispatchOutsidePointer() {
  act(() => {
    // Base UI dismisses on pointerdown (intentional) or click (sloppy) outside.
    document.body.dispatchEvent(new Event("pointerdown", { bubbles: true }));
    document.body.dispatchEvent(new Event("click", { bubbles: true }));
  });
}

describe("ConfirmActionDialog", () => {
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

  it("renders confirm + cancel actions when open", () => {
    act(() => {
      root.render(
        createElement(ConfirmActionDialog, {
          open: true,
          onOpenChange: () => undefined,
          title: "Delete?",
          description: "Permanent",
          confirmLabel: "Delete",
          cancelLabel: "Cancel",
          onConfirm: () => undefined,
        }),
      );
    });

    expect(findButton("Delete")).toBeTruthy();
    expect(findButton("Cancel")).toBeTruthy();
  });

  it("calls onOpenChange(false) on Cancel when idle", () => {
    const onOpenChange = vi.fn();
    act(() => {
      root.render(
        createElement(ConfirmActionDialog, {
          open: true,
          onOpenChange,
          title: "Delete?",
          description: "Permanent",
          confirmLabel: "Delete",
          cancelLabel: "Cancel",
          onConfirm: () => undefined,
        }),
      );
    });

    act(() => {
      findButton("Cancel")?.click();
    });

    expect(onOpenChange).toHaveBeenCalledWith(false);
  });

  it("calls onConfirm when confirm is pressed", () => {
    const onConfirm = vi.fn();
    act(() => {
      root.render(
        createElement(ConfirmActionDialog, {
          open: true,
          onOpenChange: () => undefined,
          title: "Delete?",
          description: "Permanent",
          confirmLabel: "Delete",
          cancelLabel: "Cancel",
          onConfirm,
        }),
      );
    });

    act(() => {
      findButton("Delete")?.click();
    });

    expect(onConfirm).toHaveBeenCalledTimes(1);
  });

  it("closes on Escape and outside pointerdown when idle", () => {
    const onOpenChange = vi.fn();
    act(() => {
      root.render(
        createElement(ConfirmActionDialog, {
          open: true,
          onOpenChange,
          title: "Delete?",
          description: "Permanent",
          confirmLabel: "Delete",
          cancelLabel: "Cancel",
          onConfirm: () => undefined,
        }),
      );
    });

    dispatchEscape();
    expect(onOpenChange).toHaveBeenCalledWith(false, expect.anything());

    onOpenChange.mockClear();
    dispatchOutsidePointer();
    expect(onOpenChange).toHaveBeenCalledWith(false, expect.anything());
  });

  it("blocks dismissal while isPending", () => {
    const onOpenChange = vi.fn();
    const onConfirm = vi.fn();
    act(() => {
      root.render(
        createElement(ConfirmActionDialog, {
          open: true,
          onOpenChange,
          title: "Delete?",
          description: "Permanent",
          confirmLabel: "Delete",
          cancelLabel: "Cancel",
          isPending: true,
          onConfirm,
        }),
      );
    });

    dispatchEscape();
    dispatchOutsidePointer();
    expect(onOpenChange).not.toHaveBeenCalled();

    const confirmButton = findButton("Delete");
    expect(confirmButton?.disabled).toBe(true);
  });
});
