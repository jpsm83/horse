/**
 * @vitest-environment jsdom
 */
import * as React from "react";
import { act } from "react";
import { createElement } from "react";
import { createRoot, type Root } from "react-dom/client";
import { useForm, type Control } from "react-hook-form";
import { describe, expect, it, vi } from "vitest";

import { UserPersonalSection } from "@/components/user/profile/user-personal-section.tsx";
import { UserIdentificationSection } from "@/components/user/profile/user-identification-section.tsx";
import {
  emptyProfileFormValues,
  type ProfileFormValues,
} from "@/lib/validations/profileForms.ts";

const translationMap: Record<string, string> = {
  "profile.username": "Username",
  "profile.bio": "Bio",
  "profile.emailVerified": "Verified",
  "profile.emailNotVerified": "Not verified",
  "profile.authProvider": "Sign-in method",
  "profile.gender": "Gender",
  "profile.birthDate": "Date of birth",
  "profile.nationality": "Nationality",
  "profile.phoneNumber": "Phone number",
  "profile.idType": "ID type",
  "profile.idNumber": "ID number",
  "profile.genderOptions.male": "Male",
  "profile.genderOptions.female": "Female",
  "profile.genderOptions.other": "Other",
  "profile.idTypeOptions.passport": "Passport",
  "profile.idTypeOptions.nationalId": "National ID",
  "common.firstName": "First name",
  "common.lastName": "Last name",
  "common.email": "Email",
  "common.owner": "Owner",
  "common.selectPlaceholder": "Select…",
};

vi.mock("next-intl", () => ({
  useTranslations: (namespace: string) => (key: string) =>
    translationMap[`${namespace}.${key}`] ?? key,
  useLocale: () => "en",
}));

vi.mock("@/lib/api/auth/session.ts", () => ({
  formatAuthProvider: (provider?: string) => (provider === "google" ? "Google" : "Email & password"),
}));

// base-ui Select renders a popover that does not mount in jsdom; stub the
// select primitives so field sections render their labels and text inputs.
vi.mock("@/components/ui/select", () => ({
  Select: ({ children }: { children: React.ReactNode }) => createElement("div", null, children),
  SelectContent: ({ children }: { children: React.ReactNode }) => createElement("div", null, children),
  SelectItem: ({ children }: { children: React.ReactNode }) => createElement("div", null, children),
  SelectTrigger: ({ id, children }: { id?: string; children: React.ReactNode }) =>
    createElement("button", { id, type: "button" }, children),
  SelectValue: ({ placeholder }: { placeholder?: string }) =>
    createElement("span", null, placeholder ?? ""),
}));

vi.mock("@/components/shared/profile-photo-field.tsx", () => ({
  ProfilePhotoField: () => createElement("div", { "data-testid": "profile-photo" }),
}));

function SectionHarness({
  render,
}: {
  render: (control: Control<ProfileFormValues>) => React.ReactNode;
}) {
  const form = useForm<ProfileFormValues>({ defaultValues: emptyProfileFormValues });
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

describe("UserPersonalSection", () => {
  it("renders identity fields, email, verification, and provider", () => {
    const m = mount(
      createElement(SectionHarness, {
        render: (control) =>
          createElement(UserPersonalSection, {
            control,
            email: "ada@example.com",
            emailVerified: true,
            authProvider: "google",
            initials: "AL",
            onFileSelect: () => {},
            onPreviewClear: () => {},
          }),
      }),
    );
    const text = m.container.textContent ?? "";
    expect(text).toContain("Username");
    expect(text).toContain("ada@example.com");
    expect(text).toContain("Verified");
    expect(text).toContain("Google");
    expect(text).toContain("First name");
    expect(text).toContain("Last name");
    expect(text).toContain("Date of birth");
    expect(m.container.querySelector('[data-testid="profile-photo"]')).toBeTruthy();
    unmount(m);
  });
});

describe("UserIdentificationSection", () => {
  it("renders nationality, phone, ID type, and ID number fields", () => {
    const m = mount(
      createElement(SectionHarness, {
        render: (control) =>
          createElement(UserIdentificationSection, { control }),
      }),
    );
    const text = m.container.textContent ?? "";
    expect(text).toContain("Nationality");
    expect(text).toContain("Phone number");
    expect(text).toContain("ID type");
    expect(text).toContain("ID number");
    unmount(m);
  });
});
