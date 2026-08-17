/**
 * @vitest-environment jsdom
 */
import { act } from "react";
import { createElement } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { HorseHubDisciplines } from "@/components/horses/hub/horse-hub-disciplines.tsx";
import type { HorseViewDto } from "@/lib/services/horseService.ts";

vi.mock("next-intl", () => ({
  useTranslations: (ns: string) => {
    if (ns === "horseHub") {
      return (key: string) => {
        const map: Record<string, string> = {
          disciplines: "Disciplines",
          disciplinesEmpty: "No disciplines listed.",
        };
        return map[key] ?? key;
      };
    }
    if (ns === "horseProfile") {
      return (key: string) =>
        key === "disciplineOptions.Dressage" ? "Dressage" : key;
    }
    return (key: string) => key;
  },
}));

function horseWithSections(
  sections: HorseViewDto["sections"],
  extra: Partial<HorseViewDto> = {},
): HorseViewDto {
  return {
    id: "h1",
    name: "Test Horse",
    sections,
    disciplines: ["Jumping"],
    ...extra,
  };
}

describe("HorseHubDisciplines", () => {
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

  it("renders nothing when identity section is absent (no owner-team fallback)", () => {
    act(() => {
      root.render(
        createElement(HorseHubDisciplines, {
          horse: horseWithSections({}),
        }),
      );
    });

    expect(document.body.textContent).not.toContain("Disciplines");
  });

  it("renders discipline pills from identity section", () => {
    act(() => {
      root.render(
        createElement(HorseHubDisciplines, {
          horse: horseWithSections({
            identity: { disciplines: ["Dressage"] },
          }),
        }),
      );
    });

    expect(document.body.textContent).toContain("Disciplines");
    expect(document.body.textContent).toContain("Dressage");
  });
});
