/**
 * @vitest-environment jsdom
 */
import * as React from "react";
import { act } from "react";
import { createElement } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { HubContent } from "../client.tsx";
import type { HorseViewResponse } from "@/lib/services/horseService.ts";

const useHorseViewMock = vi.fn();

vi.mock("@/hooks/queries/useHorse.ts", () => ({
  useHorseView: (...args: unknown[]) => useHorseViewMock(...args),
}));

vi.mock("@/i18n/navigation.ts", () => ({
  Link: ({ href, children }: { href: string; children: React.ReactNode }) =>
    createElement("a", { href }, children),
}));

vi.mock("@/components/horses/hub/horse-hub-gallery.tsx", () => ({
  HorseHubGallery: () => createElement("div", { "data-testid": "hub-gallery" }),
}));

vi.mock("@/components/horses/hub/horse-hub-hero.tsx", () => ({
  HorseHubHero: () => createElement("div", { "data-testid": "hub-hero" }),
}));

vi.mock("@/components/horses/hub/horse-hub-about.tsx", () => ({
  HorseHubAbout: () => null,
}));
vi.mock("@/components/horses/hub/horse-hub-disciplines.tsx", () => ({
  HorseHubDisciplines: () => null,
}));
vi.mock("@/components/horses/hub/horse-hub-value.tsx", () => ({
  HorseHubValue: () => null,
}));
vi.mock("@/components/horses/hub/horse-hub-pedigree.tsx", () => ({
  HorseHubPedigree: () => null,
}));
vi.mock("@/components/horses/hub/horse-hub-people.tsx", () => ({
  HorseHubPeople: () => null,
}));

vi.mock("next-intl", () => ({
  useTranslations: () => (key: string) => key,
}));

function viewWithGallery(gallery: unknown[] | undefined): HorseViewResponse {
  return {
    viewerRole: "guest",
    allowedTabs: ["hub"],
    horse: {
      id: "h1",
      name: "Hub Horse",
      sections: {
        identity: { disciplines: [] },
        ...(gallery !== undefined ? { gallery } : {}),
      },
    },
  };
}

describe("HubContent", () => {
  let container: HTMLDivElement;
  let root: Root;

  beforeEach(() => {
    (globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT =
      true;
    container = document.createElement("div");
    document.body.appendChild(container);
    root = createRoot(container);
    useHorseViewMock.mockReset();
  });

  afterEach(() => {
    act(() => {
      root.unmount();
    });
    container.remove();
  });

  it("renders gallery when sections.gallery is present", () => {
    useHorseViewMock.mockReturnValue({
      data: viewWithGallery([]),
      isLoading: false,
      error: null,
    });

    act(() => {
      root.render(createElement(HubContent, { horseId: "h1", shareUrl: "https://equus.app/horses/h1" }));
    });

    expect(document.querySelector('[data-testid="hub-gallery"]')).not.toBeNull();
  });

  it("omits gallery when sections.gallery is absent", () => {
    useHorseViewMock.mockReturnValue({
      data: viewWithGallery(undefined),
      isLoading: false,
      error: null,
    });

    act(() => {
      root.render(createElement(HubContent, { horseId: "h1", shareUrl: "https://equus.app/horses/h1" }));
    });

    expect(document.querySelector('[data-testid="hub-gallery"]')).toBeNull();
    expect(document.querySelector('[data-testid="hub-hero"]')).not.toBeNull();
  });
});
