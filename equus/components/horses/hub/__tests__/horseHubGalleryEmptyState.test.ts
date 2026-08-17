/**
 * @vitest-environment jsdom
 */
import { act } from "react";
import { createElement } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { HorseHubGallery } from "@/components/horses/hub/horse-hub-gallery.tsx";

vi.mock("@/hooks/queries/useHorse.ts", () => ({
  useHorseHubGallery: () => ({
    data: { items: [], total: 0, page: 1, pageSize: 12 },
    isPending: false,
    isError: false,
  }),
}));

const TRANSLATIONS: Record<string, string> = {
  media: "Media",
  mediaAll: "All",
  mediaPhotos: "Photos",
  mediaVideos: "Videos",
  mediaEmpty: "No media yet.",
  mediaEmptyPhotos: "No photos yet.",
  mediaEmptyVideos: "No videos yet.",
  mediaPrev: "Previous",
  mediaNext: "Next",
  mediaPage: "Page {page} of {total}",
};

vi.mock("next-intl", () => ({
  useTranslations: () => (key: string) => TRANSLATIONS[key] ?? key,
}));

function findTab(label: string): HTMLButtonElement | undefined {
  return Array.from(
    document.body.querySelectorAll<HTMLButtonElement>('button[role="tab"]'),
  ).find((button) => button.textContent?.trim() === label);
}

describe("HorseHubGallery empty state", () => {
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

  it("shows the icon-led empty message for All", () => {
    act(() => {
      root.render(createElement(HorseHubGallery, { horseId: "h1" }));
    });

    expect(document.body.textContent).toContain("No media yet.");
  });

  it("shows 'No photos yet.' after filtering to Photos", () => {
    act(() => {
      root.render(createElement(HorseHubGallery, { horseId: "h1" }));
    });

    act(() => {
      findTab("Photos")?.click();
    });

    expect(document.body.textContent).toContain("No photos yet.");
  });

  it("shows 'No videos yet.' after filtering to Videos", () => {
    act(() => {
      root.render(createElement(HorseHubGallery, { horseId: "h1" }));
    });

    act(() => {
      findTab("Videos")?.click();
    });

    expect(document.body.textContent).toContain("No videos yet.");
  });
});
