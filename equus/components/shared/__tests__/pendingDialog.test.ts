/**
 * @vitest-environment jsdom
 */
import * as React from "react";
import { act } from "react";
import { createElement } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { PendingDialog } from "@/components/shared/pending-dialog.tsx";

vi.mock("next-intl", () => ({
  useTranslations: () => (key: string) => key,
}));

type PendingDialogProps = React.ComponentProps<typeof PendingDialog>;

/** Render the dialog with children as a separate createElement argument. */
function renderPendingDialog(
  props: Omit<PendingDialogProps, "children">,
  children: React.ReactNode,
) {
  return createElement(
    PendingDialog as React.FC<Omit<PendingDialogProps, "children">>,
    props,
    children,
  );
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
    document.body.dispatchEvent(new Event("pointerdown", { bubbles: true }));
    document.body.dispatchEvent(new Event("click", { bubbles: true }));
  });
}

describe("PendingDialog", () => {
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

  it("renders title and children when open", () => {
    act(() => {
      root.render(
        renderPendingDialog(
          { open: true, onOpenChange: () => undefined, title: "Upload files" },
          createElement("p", null, "pending content"),
        ),
      );
    });

    expect(document.body.textContent).toContain("Upload files");
    expect(document.body.textContent).toContain("pending content");
  });

  it("closes on Escape and outside pointerdown when idle", () => {
    const onOpenChange = vi.fn();
    act(() => {
      root.render(
        renderPendingDialog(
          { open: true, onOpenChange, title: "Upload files" },
          createElement("p", null, "content"),
        ),
      );
    });

    dispatchEscape();
    expect(onOpenChange).toHaveBeenCalledWith(false, expect.anything());

    onOpenChange.mockClear();
    dispatchOutsidePointer();
    expect(onOpenChange).toHaveBeenCalledWith(false, expect.anything());
  });

  it("blocks dismissal while pending and shows a spinner", () => {
    const onOpenChange = vi.fn();
    act(() => {
      root.render(
        renderPendingDialog(
          { open: true, onOpenChange, title: "Upload files", pending: true },
          createElement("p", null, "content"),
        ),
      );
    });

    expect(
      document.body.querySelector('[aria-busy="true"]'),
    ).toBeTruthy();

    dispatchEscape();
    dispatchOutsidePointer();
    expect(onOpenChange).not.toHaveBeenCalled();
  });
});
