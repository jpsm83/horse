/**
 * @vitest-environment jsdom
 */
import * as React from "react";
import { act } from "react";
import { createElement } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { FormProvider, useForm } from "react-hook-form";

import { UserPersonalSection } from "@/components/user/profile/user-personal-section.tsx";
import { UserIdentificationSection } from "@/components/user/profile/user-identification-section.tsx";
import { UserPrivacySection } from "@/components/user/preferences/user-privacy-section.tsx";
import type { ProfileFormValues } from "@/lib/validations/profileForms.ts";
import { emptyProfileFormValues } from "@/lib/validations/profileForms.ts";
import type { PreferencesFormValues } from "@/lib/validations/preferencesForms.ts";
import { emptyPreferencesFormValues } from "@/lib/validations/preferencesForms.ts";

vi.mock("next-intl", () => ({
  useTranslations: () => (key: string) => key,
  useLocale: () => "en",
}));

function ProfileHarness({ children }: { children: React.ReactNode }) {
  const form = useForm<ProfileFormValues>({ defaultValues: emptyProfileFormValues });
  return createElement(FormProvider, form as never, children);
}

function PreferencesHarness({ children }: { children: React.ReactNode }) {
  const form = useForm<PreferencesFormValues>({
    defaultValues: emptyPreferencesFormValues,
  });
  return createElement(FormProvider, form as never, children);
}

describe("Profile field-group sections", () => {
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

  it("renders the Personal section fields (image, username, bio, name, gender, birth date)", () => {
    act(() => {
      root.render(
        createElement(
          ProfileHarness,
          null,
          createElement(UserPersonalSection, {
            control: undefined as never,
            email: "ada@example.com",
            emailVerified: true,
            authProvider: "credentials",
            initials: "AL",
            onFileSelect: () => undefined,
            onPreviewClear: () => undefined,
          }),
        ),
      );
    });

    expect(container.querySelector("#profile-username")).toBeTruthy();
    expect(container.querySelector("#profile-bio")).toBeTruthy();
    expect(container.querySelector("#profile-firstName")).toBeTruthy();
    expect(container.querySelector("#profile-lastName")).toBeTruthy();
    expect(container.querySelector("#profile-gender")).toBeTruthy();
    expect(container.querySelector("#profile-birthDate")).toBeTruthy();
  });

  it("renders the Identification section fields (nationality, phone, id type, id number)", () => {
    act(() => {
      root.render(
        createElement(
          ProfileHarness,
          null,
          createElement(UserIdentificationSection, { control: undefined as never }),
        ),
      );
    });

    expect(container.querySelector("#profile-nationality")).toBeTruthy();
    expect(container.querySelector("#profile-phoneNumber")).toBeTruthy();
    expect(container.querySelector("#profile-idType")).toBeTruthy();
    expect(container.querySelector("#profile-idNumber")).toBeTruthy();
  });

  it("renders the Preferences privacy section (profileVisibility + DM audience)", () => {
    act(() => {
      root.render(
        createElement(
          PreferencesHarness,
          null,
          createElement(UserPrivacySection, { control: undefined as never }),
        ),
      );
    });

    expect(container.querySelector("#preferences-profileVisibility")).toBeTruthy();
    expect(container.querySelector("#preferences-directMessages")).toBeTruthy();
  });
});
