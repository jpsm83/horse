/**
 * @vitest-environment jsdom
 */
import * as React from "react";
import { act } from "react";
import { createElement } from "react";
import { createRoot, type Root } from "react-dom/client";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { AuthPageContentSkeleton } from "@/components/auth/auth-page-content-skeleton.tsx";
import { AuthPageShell } from "@/components/auth/auth-page-shell.tsx";
import { SignInContent } from "@/components/auth/sign-in-content.tsx";
import { SignUpContent } from "@/components/auth/sign-up-content.tsx";
import { ForgotPasswordContent } from "@/components/auth/forgot-password-content.tsx";
import { ResetPasswordContent } from "@/components/auth/reset-password-content.tsx";
import { ConfirmEmailContent } from "@/components/auth/confirm-email-content.tsx";
import { ResendConfirmationContent } from "@/components/auth/resend-confirmation-content.tsx";
import { GoogleSignInButton } from "@/components/auth/google-sign-in-button.tsx";

const translationMap: Record<string, string> = {
  "auth.signIn.title": "Sign in",
  "auth.signIn.description": "Use your email and password or continue with Google.",
  "auth.signIn.submit": "Sign in",
  "auth.signIn.submitting": "Signing in...",
  "auth.signIn.noAccount": "Don't have an account?",
  "auth.signIn.forgotPassword": "Forgot password?",
  "auth.signIn.resendConfirmation": "Resend confirmation",
  "auth.signUp.title": "Create account",
  "auth.signUp.description": "Join Equus in minutes.",
  "auth.signUp.submit": "Create account",
  "auth.signUp.submitting": "Creating account...",
  "auth.signUp.hasAccount": "Already have an account?",
  "auth.signUp.horseLabel": "for {name}",
  "auth.forgotPassword.title": "Reset password",
  "auth.forgotPassword.description": "Enter your email to receive a reset link.",
  "auth.forgotPassword.submit": "Send reset link",
  "auth.forgotPassword.success": "Check your email.",
  "auth.forgotPassword.backToSignIn": "Back to sign in",
  "auth.resetPassword.title": "Set new password",
  "auth.resetPassword.description": "Choose a new password for your account.",
  "auth.resetPassword.newPassword": "New password",
  "auth.resetPassword.confirmPassword": "Confirm password",
  "auth.resetPassword.submit": "Save password",
  "auth.resetPassword.success": "Password updated.",
  "auth.resetPassword.missingToken": "The reset link is invalid or expired.",
  "auth.confirmEmail.title": "Confirm email",
  "auth.confirmEmail.verifying": "Verifying your email...",
  "auth.confirmEmail.success": "Email confirmed.",
  "auth.confirmEmail.error": "Could not confirm your email.",
  "auth.confirmEmail.missingToken": "The confirmation link is invalid or expired.",
  "auth.confirmEmail.resend": "Resend confirmation",
  "auth.resendConfirmation.title": "Resend confirmation email",
  "auth.resendConfirmation.description": "Enter your email to resend the confirmation.",
  "auth.resendConfirmation.submit": "Resend email",
  "auth.resendConfirmation.success": "Confirmation email sent.",
  "auth.resendConfirmation.alreadyVerified": "Your email is already verified.",
  "auth.resendConfirmation.backToSignIn": "Back to sign in",
  "auth.google.continue": "Continue with Google",
  "auth.google.failed": "Google sign-in failed.",
  "auth.passwordPolicy": "At least 8 characters.",
  "common.signIn": "Sign in",
  "common.signUp": "Sign up",
  "common.email": "Email",
  "common.password": "Password",
  "common.firstName": "First name",
  "common.lastName": "Last name",
  "common.loading": "Loading...",
  "common.or": "or",
  "common.accountType": "Account type",
  "common.selectAccountType": "Select account type",
  "common.individual": "Individual",
  "common.business": "Business",
  "common.businessDetails": "Business details",
  "common.businessName": "Business name",
  "common.registrationNumber": "Registration number",
  "common.taxId": "Tax ID",
  "common.countryOfRegistration": "Country of registration",
  "common.countryCodeHint": "2-letter country code",
  "invites.signup.staffBanner": "You are joining as staff.",
  "invites.signup.relationshipBanner": "You are joining to connect with a horse.",
};

const credentialsMock = vi.hoisted(() => ({
  loginWithCredentials: vi.fn(),
  registerWithCredentials: vi.fn(),
  confirmEmail: vi.fn(),
  requestPasswordReset: vi.fn(),
  resetPassword: vi.fn(),
  requestEmailConfirmation: vi.fn(),
}));

const sessionMock = vi.hoisted(() => ({
  isApiClientError: vi.fn(() => false),
}));

const authState = vi.hoisted(() => ({
  user: null as { id: string; email: string; profileComplete: boolean } | null,
  isAuthenticated: false,
  isLoading: false,
}));

const inviteState = vi.hoisted(() => ({
  data: null as { kind: string; horseName?: string; requesterLabel?: string } | null,
  isError: false,
}));

vi.mock("next-intl", () => ({
  useTranslations: (namespace: string) => (key: string, values?: Record<string, string>) => {
    let value = translationMap[`${namespace}.${key}`] ?? key;
    if (values) {
      for (const [k, v] of Object.entries(values)) {
        value = value.replace(`{${k}}`, v);
      }
    }
    return value;
  },
  useLocale: () => "en",
}));

vi.mock("@/i18n/navigation.ts", () => ({
  Link: ({ href, children }: { href: string; children: React.ReactNode }) =>
    createElement("a", { href }, children),
  useRouter: () => ({ replace: vi.fn(), push: vi.fn(), refresh: vi.fn() }),
  usePathname: () => "/signin",
}));

vi.mock("@/hooks/use-app-auth.ts", () => ({
  useAppAuth: () => ({
    user: authState.user,
    isAuthenticated: authState.isAuthenticated,
    isLoading: authState.isLoading,
    logout: async () => {},
  }),
}));

vi.mock("@/hooks/queries/useInvite.ts", () => ({
  useInvitePreview: () => ({
    data: inviteState.data,
    isError: inviteState.isError,
  }),
}));

vi.mock("@/lib/api/auth/credentials", () => credentialsMock);

vi.mock("@/lib/api/auth/session", () => sessionMock);

vi.mock("@/lib/auth/clearClientAuthSession.ts", () => ({
  clearClientAuthSession: vi.fn(async () => {}),
}));

vi.mock("next-auth/react", () => ({
  signIn: vi.fn(async () => {}),
}));

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

async function mountAsync(ui: React.ReactElement): Promise<Mount> {
  const container = document.createElement("div");
  document.body.appendChild(container);
  const root = createRoot(container);
  await act(async () => {
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

beforeEach(() => {
  authState.user = null;
  authState.isAuthenticated = false;
  authState.isLoading = false;
  inviteState.data = null;
  inviteState.isError = false;
  Object.values(credentialsMock).forEach((fn) => (fn as ReturnType<typeof vi.fn>).mockReset());
});

describe("AuthPageContentSkeleton", () => {
  it("renders a skeleton container with a spinner by default", () => {
    const m = mount(createElement(AuthPageContentSkeleton));
    expect(m.container.querySelector('[data-slot="spinner"]')).toBeTruthy();
    expect(m.container.querySelector(".relative.w-full.h-full")).toBeTruthy();
    unmount(m);
  });

  it("hides the spinner when showSpinner is false", () => {
    const m = mount(createElement(AuthPageContentSkeleton, { showSpinner: false }));
    expect(m.container.querySelector('[data-slot="spinner"]')).toBeNull();
    unmount(m);
  });
});

describe("AuthPageShell", () => {
  it("renders title, description, children, and footer", () => {
    const m = mount(
      createElement(
        AuthPageShell,
        { title: "Sign in", description: "Welcome back", footer: createElement("span", null, "Footer") },
        createElement("div", null, "Body content"),
      ),
    );
    const text = m.container.textContent ?? "";
    expect(text).toContain("Sign in");
    expect(text).toContain("Welcome back");
    expect(text).toContain("Body content");
    expect(text).toContain("Footer");
    unmount(m);
  });
});

describe("GoogleSignInButton", () => {
  it("renders the or-divider and button", () => {
    const m = mount(createElement(GoogleSignInButton));
    const text = m.container.textContent ?? "";
    expect(text).toContain("or");
    expect(text).toContain("Continue with Google");
    expect(m.container.querySelector("button")).toBeTruthy();
    unmount(m);
  });
});

describe("SignInContent", () => {
  it("renders email + password fields and a submit button", () => {
    const m = mount(createElement(SignInContent, { postAuthPath: "/home" }));
    const text = m.container.textContent ?? "";
    expect(text).toContain("Email");
    expect(text).toContain("Password");
    expect(text).toContain("Sign in");
    unmount(m);
  });

  it("shows the forgot-password and sign-up links in the footer", () => {
    const m = mount(createElement(SignInContent, { postAuthPath: "/home" }));
    const anchors = Array.from(m.container.querySelectorAll("a"));
    expect(anchors.some((a) => a.getAttribute("href") === "/forgot-password")).toBe(true);
    expect(anchors.some((a) => a.getAttribute("href") === "/signup")).toBe(true);
    unmount(m);
  });
});

describe("SignUpContent", () => {
  it("renders the registration fields and account type selector", () => {
    const m = mount(
      createElement(SignUpContent, { postAuthPath: "/home", ref: undefined, isStaffRef: false }),
    );
    const text = m.container.textContent ?? "";
    expect(text).toContain("First name");
    expect(text).toContain("Last name");
    expect(text).toContain("Email");
    expect(text).toContain("Password");
    expect(text).toContain("Account type");
    unmount(m);
  });

  it("shows an invite banner when a relationship ref is present", () => {
    inviteState.data = { kind: "relationship", horseName: "Comet" };
    const m = mount(
      createElement(SignUpContent, { postAuthPath: "/home", ref: "REF-123", isStaffRef: false }),
    );
    const text = m.container.textContent ?? "";
    expect(text).toContain("You are joining to connect with a horse.");
    unmount(m);
  });
});

describe("ForgotPasswordContent", () => {
  it("renders an email field and submit button", () => {
    const m = mount(createElement(ForgotPasswordContent));
    const text = m.container.textContent ?? "";
    expect(text).toContain("Email");
    expect(text).toContain("Send reset link");
    unmount(m);
  });
});

describe("ResetPasswordContent", () => {
  it("shows the missing-token state when token is null", () => {
    const m = mount(createElement(ResetPasswordContent, { token: null }));
    const text = m.container.textContent ?? "";
    expect(text).toContain("The reset link is invalid or expired.");
    unmount(m);
  });

  it("renders password fields when a token is present", () => {
    const m = mount(createElement(ResetPasswordContent, { token: "tok-123" }));
    const text = m.container.textContent ?? "";
    expect(text).toContain("New password");
    expect(text).toContain("Confirm password");
    unmount(m);
  });
});

describe("ConfirmEmailContent", () => {
  it("shows the missing-token state when token is null", () => {
    const m = mount(createElement(ConfirmEmailContent, { token: null }));
    const text = m.container.textContent ?? "";
    expect(text).toContain("The confirmation link is invalid or expired.");
    unmount(m);
  });

  it("shows the verifying state while the token is being confirmed", () => {
    credentialsMock.confirmEmail.mockReturnValue(new Promise(() => {}));
    const m = mount(createElement(ConfirmEmailContent, { token: "tok-123" }));
    const text = m.container.textContent ?? "";
    expect(text).toContain("Verifying your email...");
    unmount(m);
  });

  it("shows the success state after the token is confirmed", async () => {
    credentialsMock.confirmEmail.mockResolvedValue({ message: "Confirmed!" });
    const m = await mountAsync(createElement(ConfirmEmailContent, { token: "tok-123" }));
    const text = m.container.textContent ?? "";
    expect(text).toContain("Confirmed!");
    unmount(m);
  });
});

describe("ResendConfirmationContent", () => {
  it("renders an email field and submit button", () => {
    const m = mount(createElement(ResendConfirmationContent));
    const text = m.container.textContent ?? "";
    expect(text).toContain("Email");
    expect(text).toContain("Resend email");
    unmount(m);
  });
});
