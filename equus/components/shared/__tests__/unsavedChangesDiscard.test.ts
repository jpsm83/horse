/**
 * @vitest-environment jsdom
 */
import * as React from "react";
import { act } from "react";
import { createElement } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import {
  UnsavedChangesProvider,
  useUnsavedChanges,
} from "@/components/shared/unsaved-changes-context.tsx";

const pushMock = vi.fn();

vi.mock("@/i18n/navigation.ts", () => ({
  useRouter: () => ({ push: pushMock }),
}));

vi.mock("@/components/shared/confirm-action-dialog.tsx", () => ({
  ConfirmActionDialog: ({
    open,
    onConfirm,
    confirmLabel,
  }: {
    open: boolean;
    onConfirm: () => void;
    confirmLabel: string;
  }) =>
    open
      ? createElement(
          "button",
          { type: "button", onClick: onConfirm },
          confirmLabel,
        )
      : null,
}));

type ProviderProps = Omit<
  React.ComponentProps<typeof UnsavedChangesProvider>,
  "children"
>;

/** Render the provider with children as a separate createElement argument. */
function renderProvider(props: ProviderProps, children: React.ReactNode) {
  return createElement(
    UnsavedChangesProvider as React.FC<ProviderProps>,
    props,
    children,
  );
}

function Controls({ href }: { href: string }) {
  const { setDirty, requestNavigation } = useUnsavedChanges();
  return createElement(
    "div",
    null,
    createElement(
      "button",
      {
        type: "button",
        "data-testid": "mark-dirty",
        onClick: () => setDirty(true),
      },
      "Dirty",
    ),
    createElement(
      "button",
      {
        type: "button",
        "data-testid": "navigate",
        onClick: () => requestNavigation(href),
      },
      "Navigate",
    ),
  );
}

describe("UnsavedChangesProvider onDiscard", () => {
  let container: HTMLDivElement;
  let root: Root;

  beforeEach(() => {
    pushMock.mockReset();
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

  it("invokes onDiscard before navigating when leave is confirmed", () => {
    const onDiscard = vi.fn();

    act(() => {
      root.render(
        renderProvider(
          {
            dialogTitle: "Unsaved",
            dialogDescription: "Leave?",
            stayLabel: "Stay",
            leaveLabel: "Leave",
            onDiscard,
          },
          createElement(Controls, { href: "/user/1/profile" }),
        ),
      );
    });

    act(() => {
      container.querySelector<HTMLButtonElement>("[data-testid=mark-dirty]")?.click();
    });
    act(() => {
      container.querySelector<HTMLButtonElement>("[data-testid=navigate]")?.click();
    });

    expect(onDiscard).not.toHaveBeenCalled();
    expect(pushMock).not.toHaveBeenCalled();

    const leaveButton = Array.from(container.querySelectorAll("button")).find(
      (button) => button.textContent === "Leave",
    );
    expect(leaveButton).toBeTruthy();

    act(() => {
      leaveButton?.click();
    });

    expect(onDiscard).toHaveBeenCalledTimes(1);
    expect(pushMock).toHaveBeenCalledWith("/user/1/profile");
  });

  it("navigates without onDiscard when clean", () => {
    const onDiscard = vi.fn();

    act(() => {
      root.render(
        renderProvider(
          {
            dialogTitle: "Unsaved",
            dialogDescription: "Leave?",
            stayLabel: "Stay",
            leaveLabel: "Leave",
            onDiscard,
          },
          createElement(Controls, { href: "/user/1/preferences" }),
        ),
      );
    });

    act(() => {
      container.querySelector<HTMLButtonElement>("[data-testid=navigate]")?.click();
    });

    expect(onDiscard).not.toHaveBeenCalled();
    expect(pushMock).toHaveBeenCalledWith("/user/1/preferences");
  });
});
