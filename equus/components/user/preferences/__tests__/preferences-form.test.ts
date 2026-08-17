/**
 * @vitest-environment jsdom
 */
import * as React from "react";
import { act } from "react";
import { createElement } from "react";
import { createRoot, type Root } from "react-dom/client";
import { useForm, type Control } from "react-hook-form";
import { describe, expect, it, vi } from "vitest";

import { UserAppearanceSection } from "@/components/user/preferences/user-appearance-section.tsx";
import { UserPrivacySection } from "@/components/user/preferences/user-privacy-section.tsx";
import {
  emptyPreferencesFormValues,
  type PreferencesFormValues,
} from "@/lib/validations/preferencesForms.ts";

const translationMap: Record<string, string> = {
  "profile.preferredLanguage": "Preferred language",
  "profile.preferredTheme": "Theme",
  "profile.profileVisibility": "Profile visibility",
  "profile.allowDirectMessagesFrom": "Who can message you",
  "profile.languageOptions.en": "English",
  "profile.languageOptions.es": "Spanish",
  "profile.themeOptions.default": "Default",
  "profile.themeOptions.onyx": "Onyx",
  "profile.visibilityOptions.public": "Public",
  "profile.visibilityOptions.platform": "Platform",
  "profile.visibilityOptions.relationshipsOnly": "Relationships only",
  "profile.visibilityOptions.private": "Private",
  "profile.directMessageAudienceOptions.everyone": "Everyone",
  "profile.directMessageAudienceOptions.relationships": "Relationships",
  "profile.directMessageAudienceOptions.nobody": "Nobody",
};

vi.mock("next-intl", () => ({
  useTranslations: (namespace: string) => (key: string) =>
    translationMap[`${namespace}.${key}`] ?? key,
  useLocale: () => "en",
}));

// base-ui Select does not mount its popover in jsdom; stub the select primitives
// so sections render their labels.
vi.mock("@/components/ui/select", () => ({
  Select: ({ children }: { children: React.ReactNode }) => createElement("div", null, children),
  SelectContent: ({ children }: { children: React.ReactNode }) => createElement("div", null, children),
  SelectItem: ({ children }: { children: React.ReactNode }) => createElement("div", null, children),
  SelectTrigger: ({ id, children }: { id?: string; children: React.ReactNode }) =>
    createElement("button", { id, type: "button" }, children),
  SelectValue: ({ placeholder }: { placeholder?: string }) =>
    createElement("span", null, placeholder ?? ""),
}));

vi.mock("@/lib/theme/appTheme.ts", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/theme/appTheme.ts")>();
  return {
    ...actual,
    applyThemeToDocument: vi.fn(),
    syncThemeCookie: vi.fn(),
  };
});

vi.mock("@/utils/enums.ts", async (importOriginal) => {
  const actual = (await importOriginal()) as Record<string, unknown>;
  return {
    ...actual,
    appThemeEnums: ["default", "onyx"],
    appLocaleEnums: ["en", "es"],
  };
});

function SectionHarness({
  render,
}: {
  render: (control: Control<PreferencesFormValues>) => React.ReactNode;
}) {
  const form = useForm<PreferencesFormValues>({ defaultValues: emptyPreferencesFormValues });
  return createElement("div", null, render(form.control));
}

type Mount = { container: HTMLDivElement; root: Root };

function mount(ui: React.ReactElement): Mount {
  const container = document.createElement("div");
  document.body.appendChild(container);
  const root = createRoot(container);
  act(() => {
    root.render(ui);
  });
  return { container, root };
}

function unmount(m: Mount): void {
  act(() => {
    m.root.unmount();
  });
  m.container.remove();
}

describe("UserAppearanceSection", () => {
  it("renders language selector and theme swatches", () => {
    const m = mount(
      createElement(SectionHarness, {
        render: (control) =>
          createElement(UserAppearanceSection, { control }),
      }),
    );
    const text = m.container.textContent ?? "";
    expect(text).toContain("Preferred language");
    expect(text).toContain("Theme");
    expect(text).toContain("Default");
    expect(text).toContain("Onyx");
    expect(m.container.querySelectorAll("button").length).toBeGreaterThan(0);
    unmount(m);
  });
});

describe("UserPrivacySection", () => {
  it("renders visibility and DM audience controls", () => {
    const m = mount(
      createElement(SectionHarness, {
        render: (control) =>
          createElement(UserPrivacySection, { control }),
      }),
    );
    const text = m.container.textContent ?? "";
    expect(text).toContain("Profile visibility");
    expect(text).toContain("Who can message you");
    unmount(m);
  });
});
