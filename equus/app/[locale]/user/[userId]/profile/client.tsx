"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { ErrorBoundary } from "react-error-boundary";

import { ProfileForm } from "@/components/user/profile/profile-form.tsx";
import { UserVisibilitySection } from "@/components/user/profile/user-visibility-section.tsx";
import { UserSecuritySection } from "@/components/user/profile/user-security-section.tsx";
import { UserAccountSection } from "@/components/user/profile/user-account-section.tsx";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { LoadingOverlay } from "@/components/shared/loading-overlay.tsx";
import { Section } from "@/components/shared/section.tsx";
import { InlineErrorFallback } from "@/components/errors/inline-error-fallback.tsx";
import { UserPageShell } from "@/components/user/user-page-shell.tsx";
import { useUnsavedChanges } from "@/components/shared/unsaved-changes-context.tsx";
import { useAppAuth } from "@/hooks/use-app-auth.ts";
import { useUserView } from "@/hooks/queries/useCurrentUser.ts";
import { queryKeys } from "@/lib/api/queryKeys";
import { useQueryClient } from "@tanstack/react-query";

type ProfileContentProps = {
  userId: string;
};

export function ProfileContent({ userId }: ProfileContentProps) {
  return (
    <UserPageShell userId={userId}>
      <ProfileFormContent userId={userId} />
    </UserPageShell>
  );
}

function ProfileFormContent({ userId }: ProfileContentProps) {
  const t = useTranslations("profile");
  const tCommon = useTranslations("common");
  const queryClient = useQueryClient();
  const { user } = useAppAuth();
  // Reads from HydrationBoundary cache — no extra fetch when layout.tsx RSC succeeded.
  const { data: view } = useUserView(userId);
  const profile = view?.user;
  const { setDirty, setSaving } = useUnsavedChanges();

  const [isSaving, setIsSaving] = useState(false);
  const [isDeactivating, setIsDeactivating] = useState(false);

  function handleSavingChange(saving: boolean) {
    setIsSaving(saving);
    setSaving(saving);
  }

  function handleDirtyChange(dirty: boolean) {
    setDirty(dirty);
  }

  useEffect(() => {
    setSaving(isDeactivating);
  }, [isDeactivating, setSaving]);

  if (!profile || !user) return null;

  const personalDetails = (profile.personalDetails ?? {}) as Record<string, unknown>;
  const email = typeof personalDetails.email === "string" ? personalDetails.email : user.email;
  const imageUrl = typeof personalDetails.imageUrl === "string" ? personalDetails.imageUrl : undefined;
  const hasPassword = profile.hasPassword ?? user.hasPassword ?? false;

  return (
    <div className="relative isolate z-0 flex min-h-0 flex-1 flex-col gap-6" aria-busy={isSaving || isDeactivating}>
      <div className="space-y-2">
        <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">{t("title")}</h1>
        <p className="text-muted-foreground">{t("description")}</p>
      </div>

      {!user.profileComplete ? (
        <Alert>
          <AlertDescription>{t("incompleteBanner")}</AlertDescription>
        </Alert>
      ) : null}

      {/* Personal details, photo, address — deferred form (owns useForm + Save) */}
      <Section title={t("sections.personal")}>
        <ErrorBoundary fallbackRender={(p) => <InlineErrorFallback {...p} />}>
          <ProfileForm
            personalDetails={personalDetails}
            email={email}
            emailVerified={user.emailVerified === true}
            authProvider={user.authProvider ?? "credentials"}
            imageUrl={imageUrl}
            userType={profile.userType ?? "individual"}
            businessDetails={
              (profile.businessDetails as Record<string, unknown> | undefined) ?? null
            }
            onSavingChange={handleSavingChange}
            onDirtyChange={handleDirtyChange}
            onSaved={() => {
              queryClient.invalidateQueries({ queryKey: queryKeys.users.me });
              queryClient.invalidateQueries({ queryKey: queryKeys.users.view(userId) });
            }}
          />
        </ErrorBoundary>
      </Section>

      {/* Visibility — Layer-1 profile visibility (immediate-action) */}
      <Section title={t("sections.visibility")}>
        <ErrorBoundary fallbackRender={(p) => <InlineErrorFallback {...p} />}>
          <UserVisibilitySection profile={profile} />
        </ErrorBoundary>
      </Section>

      {/* Security — password set/change (immediate-action) */}
      <Section title={t("sections.security")}>
        <ErrorBoundary fallbackRender={(p) => <InlineErrorFallback {...p} />}>
          <UserSecuritySection
            hasPassword={hasPassword}
            authProvider={user.authProvider ?? "credentials"}
          />
        </ErrorBoundary>
      </Section>

      {/* Account — deactivation (immediate-action) */}
      <Section title={t("sections.account")}>
        <ErrorBoundary fallbackRender={(p) => <InlineErrorFallback {...p} />}>
          <UserAccountSection onDeactivatingChange={setIsDeactivating} />
        </ErrorBoundary>
      </Section>

      <LoadingOverlay
        active={isSaving || isDeactivating}
        label={isDeactivating ? t("deactivateSubmitting") : tCommon("loading")}
      />
    </div>
  );
}
